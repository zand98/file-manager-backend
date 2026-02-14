import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UserService } from '../user/user.service';
import { RolesService } from '../roles/roles.service';
import { RedisService } from '../redis/redis.service';
import { OtpService } from '../../shared/services/otp.service';
import {
  OtpResponseCodes,
  RedisActions,
  TokenType,
} from '../../shared/enums/auth.enums';

import { LoginPayload } from './PayloadAuth/login.payload';
import { RegisterPayload } from './PayloadAuth/register.payload';
import { ResetPasswordDto } from './PayloadAuth/reset-password.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly OTP_TTL_SECONDS = 180; // 3 minutes
  private readonly OTP_MAX_PER_DAY = 20;
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly roleService: RolesService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Validate user credentials (phone + password)
   */
  async validateUser(phoneNumber: string, password: string): Promise<User> {
    const user = await this.userService.getByPhoneNumber(phoneNumber);
    if (!user) {
      console.log(`[AuthService] User not found for phone: ${phoneNumber}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Debug logging for password validation
    console.log(`[AuthService] User found: ${user.id}. Stored password prefix: ${user.password ? user.password.substring(0, 10) : 'NULL'}`);
    
    const isValid = await this.userService.validatePassword(user, password);
    console.log(`[AuthService] Password validation result: ${isValid}`);

    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  /**
   * Register a new user with OTP verification flow
   */
  async registerUser(payload: RegisterPayload): Promise<any> {
    if (payload.phoneNumber.length !== 11) {
      throw new BadRequestException('Phone number must be 11 digits');
    }

    const existingUser = await this.userService.getByPhoneNumber(payload.phoneNumber);
    if (existingUser) throw new ConflictException('Phone number already registered');

    // Prepare data (hash password for eventual storage, but maybe store plain in Redis? 
    // Actually, create() in UserService usually takes plain password if it hashes it?
    // Let's check UserService.create().
    // Step 0 shows: UserService.create() takes { ... phoneNumber, password, ... }
    // It calls `userRepository.create(userData)`. It DOES NOT hash password in create().
    // It relies on caller to hash it? 
    // Step 0 check: `user.password = await bcrypt.hash(newPassword, this.saltRounds)` is in `updateUserPassword`.
    // BUT `create` method: `const newUser = this.userRepository.create(userData); await this.userRepository.save(newUser);`.
    // It does NOT hash. 
    // So `registerUser` MUST hash the password before calling `userService.create`.
    
    const hashedPassword = await bcrypt.hash(payload.password, this.SALT_ROUNDS);
    
    const roles = await this.roleService.findByNames(payload.roles && payload.roles.length ? payload.roles : ['user']);
    if (!roles.length) throw new BadRequestException('No valid roles found');

    const newUserData = {
      ...payload,
      password: hashedPassword,
      roles: roles,
      disabled: payload.disabled || false,
    };

    const redisRecord = await this.redisService.getData<any>(payload.phoneNumber);

    if (redisRecord && redisRecord.action === RedisActions.REGISTER && redisRecord.isOtpVerified) {
      // Create user
      const createdUser = await this.userService.create(newUserData);
      const tokens = await this.generateTokens(createdUser);

      await this.redisService.delKey(payload.phoneNumber);

      const user = await this.userService.getById(createdUser.id, ['roles']);
      delete user.password;
      delete user.refreshToken;

      return {
        user,
        otpResponse: OtpResponseCodes.USER_REGISTERED,
        ...tokens,
      };
    }

    await this.redisService.saveData(payload.phoneNumber, {
      action: RedisActions.REGISTER,
      isOtpVerified: false,
      otpCode: null,
      userData: newUserData,
    });

    return {
      otpResponse: OtpResponseCodes.OTP_SENT,
      message: 'User will be created once OTP verified',
    };
  }

  /**
   * Send OTP Code
   */
  async sendOtpCode(phoneNumber: string) {
    if (phoneNumber.length !== 11) throw new BadRequestException('Phone number must be 11 digits');
    
    const tempData = await this.redisService.getData(phoneNumber);
    if (!tempData) throw new BadRequestException('Phone number verification session expired or does not exist');

    const countKey = `count:${phoneNumber}`;
    const count = await this.redisService.getOrInitializeCount(countKey);
    if (count >= this.OTP_MAX_PER_DAY) throw new ForbiddenException('OTP limit reached for today');

    const otpCode = crypto.randomInt(100000, 999999).toString();
    
    // Log OTP for development/debug purposes as requested
    console.log(`[AuthService] Generated OTP for ${phoneNumber}: ${otpCode}`);

    // Send OTP
    if (this.configService.get('OTP_DISABLE') !== 'true') {
      await this.otpService.sendOtp(phoneNumber, otpCode);
    }
    
    await this.redisService.incrementCount(countKey);
    await this.redisService.updateField(phoneNumber, 'otpCode', otpCode);

    return {
      otpResponse: OtpResponseCodes.OTP_SENT,
      message: 'OTP sent successfully',
    };
  }

  /**
   * Verify OTP
   */
  async verifyOtpCode(phoneNumber: string, otpCode: string): Promise<any> {
    if (phoneNumber.length !== 11) throw new BadRequestException('Phone number must be 11 digits');

    const tempData = await this.redisService.getData<any>(phoneNumber);
    if (!tempData || !tempData.otpCode) throw new UnauthorizedException('OTP not found or expired');
    if (tempData.otpCode !== otpCode) throw new UnauthorizedException('OTP code is incorrect');

    await this.redisService.updateField(phoneNumber, 'isOtpVerified', true);

    if (tempData.action === RedisActions.REGISTER) {
      return this.registerUser(tempData.userData);
    } else if (tempData.action === RedisActions.FORGET_PASSWORD) {
      return this.finalizeForgetPassword(tempData.userData);
    }
    throw new BadRequestException('Unknown action');
  }

  /**
   * Initiate Forget Password
   */
  async forgetPassword(phoneNumber: string, newPassword: string): Promise<any> {
    if (phoneNumber.length !== 11) throw new BadRequestException('Phone number must be 11 digits');
    
    const user = await this.userService.getByPhoneNumber(phoneNumber);
    if (!user) throw new NotFoundException('User not found');

    // Store plain text password here because finalization uses updatePassword which hashes
    await this.redisService.saveData(phoneNumber, {
      action: RedisActions.FORGET_PASSWORD,
      isOtpVerified: false,
      otpCode: null,
      userData: { phoneNumber, newPassword, userId: user.id },
    });

    return {
      otpResponse: OtpResponseCodes.PASSWORD_PENDING_OTP,
      message: 'Password will be updated once OTP verified',
    };
  }

  private async finalizeForgetPassword(userData: any): Promise<any> {
    const { userId, newPassword, phoneNumber } = userData;
    
    // Hashes the password
    const updatedUser = await this.userService.updateUserPassword(userId, newPassword);

    const tokens = await this.generateTokens(updatedUser);
    await this.redisService.delKey(phoneNumber);

    delete updatedUser.password;
    delete updatedUser.refreshToken;

    return {
      user: updatedUser,
      otpResponse: OtpResponseCodes.PASSWORD_CHANGED,
      ...tokens,
    };
  }

  async login(payload: LoginPayload): Promise<any> {
    const user = await this.validateUser(payload.phoneNumber, payload.password);
    const tokens = await this.generateTokens(user);

    delete user.password;
    delete user.refreshToken;

    return { user, ...tokens };
  }

  async refreshToken(accessToken: string, refreshToken: string): Promise<any> {
    const user = await this.userService.getByUserToken(accessToken);
    if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid token or user');

    try {
      this.jwtService.verify(refreshToken, {
         secret: this.configService.get('REFRESH_TOKEN_SECRET_KEY')
      });
    } catch {
      throw new UnauthorizedException('Expired refresh token');
    }

    if (user.refreshToken !== refreshToken) throw new UnauthorizedException('Refresh token mismatch');

    const newTokens = await this.generateTokens(user);
    delete user.password;
    delete user.refreshToken;

    return { user, ...newTokens };
  }

  async resetPasswordWithVerification(dto: ResetPasswordDto): Promise<User> {
     const user = await this.userService.getByUserToken(dto.userToken);
     if (!user || !user.password) throw new BadRequestException('Invalid request');

     const isOldValid = await bcrypt.compare(dto.oldPassword, user.password);
     if (!isOldValid) throw new BadRequestException('Old password incorrect');

     if (dto.oldPassword === dto.newPassword) throw new BadRequestException('New password must be different');

     return this.userService.updateUserPassword(user.id, dto.newPassword);
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      roles: user.roles.map((r) => r.name),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET_KEY'),
        expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRATION_TIME') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET_KEY'),
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRATION_TIME') || '7d',
      }),
    ]);

    await this.userService.saveRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  }
}
