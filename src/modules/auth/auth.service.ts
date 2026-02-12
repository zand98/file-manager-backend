import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginPayload } from './PayloadAuth/login.payload';
import { RegisterPayload } from './PayloadAuth/register.payload';
import * as bcrypt from 'bcrypt';
import { RolesService } from '../roles/roles.service';
import { User } from '../user/entities/user.entity';
import { In } from 'typeorm';
import { ResetPasswordDto } from './PayloadAuth/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly roleService: RolesService,
  ) {}

  async validateUser(phoneNumber: string, password: string): Promise<any> {
    const user = await this.userService.getByPhoneNumber(phoneNumber);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.userService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async registerUser(payload: RegisterPayload): Promise<User> {
    // 1. Validate phone number
    if (payload.phoneNumber.length !== 11) {
      throw new BadRequestException('Phone number must be 11 digits');
    }

    // 2. Check if user exists
    const existingUser = await this.userService.getByPhoneNumber(
      payload.phoneNumber,
    );
    if (existingUser) {
      throw new ConflictException('Phone number already registered');
    }

    // 3. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

    // 4. Find and validate roles
    const roles = await this.roleService.findByNames(payload.roles);

    // 5. Verify all requested roles exist
    if (roles.length !== payload.roles.length) {
      const missingRoles = payload.roles.filter(
        (roleName) => !roles.some((role) => role.name === roleName),
      );
      throw new BadRequestException(
        `The following roles don't exist: ${missingRoles.join(', ')}`,
      );
    }

    // 6. Create user
    const newUser = await this.userService.create({
      phoneNumber: payload.phoneNumber,
      password: hashedPassword,
      name: payload.name,
      disabled: payload.disabled || false,
      roles: roles, // This is now properly typed as Role[]
    });

    return newUser; // Assuming userService.create returns UserResponseDto
  }

  async resetPasswordWithVerification(dto: ResetPasswordDto): Promise<User> {
    // 1. Find user by token (with password field)
    const user = await this.userService.getByUserToken(dto.userToken, []);

    if (!user || !user.password) {
      throw new BadRequestException('Invalid user token or no password set');
    }

    // 2. PROPERLY verify old password using bcrypt.compare()
    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // 3. Verify new password is different (compare plaintext first)
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from old password',
      );
    }

    // 4. Update password using the service method
    const updatedUser = await this.userService.updateUserPassword(
      user.id,
      dto.newPassword,
    );

    delete updatedUser?.password; // Remove password from response
    return updatedUser;
  }
  async createToken(user: any): Promise<{ access_token: string }> {
    const payload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      roles: user.roles.map((role) => role.name),
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async refreshToken(token: string): Promise<{ access_token: string }> {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userService.getById(decoded.sub, ['roles']);

      if (!user) {
        throw new UnauthorizedException('User is not found');
      }

      return this.createToken(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
