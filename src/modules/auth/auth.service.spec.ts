import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RolesService } from '../roles/roles.service';
import { ConfigService } from '../config/config.service';
import { RedisService } from '../redis/redis.service';
import { OtpService } from '../../shared/services/otp.service';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: any;
  let jwtService: any;
  let redisService: any;
  let roleService: any;
  let configService: any;
  let otpService: any;

  const mockUser = {
    id: 1,
    phoneNumber: '12345678901',
    password: 'hashedPassword',
    roles: [{ name: 'user' }],
  };

  beforeEach(async () => {
    userService = {
      getByPhoneNumber: jest.fn(),
      validatePassword: jest.fn(),
      create: jest.fn(),
      getById: jest.fn(),
      updateUserPassword: jest.fn(),
      saveRefreshToken: jest.fn(),
      getByUserToken: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verify: jest.fn(),
    };
    redisService = {
      saveData: jest.fn(),
      getData: jest.fn(),
      getOrInitializeCount: jest.fn(),
      incrementCount: jest.fn(),
      updateField: jest.fn(),
      delKey: jest.fn(),
    };
    roleService = {
      findByNames: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('secret'),
    };
    otpService = {
      sendOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redisService },
        { provide: RolesService, useValue: roleService },
        { provide: ConfigService, useValue: configService },
        { provide: OtpService, useValue: otpService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if validation succeeds', async () => {
      userService.getByPhoneNumber.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser('12345678901', 'pass');
      expect(result).toEqual(mockUser);
    });

    it('should throw if user not found', async () => {
      userService.getByPhoneNumber.mockResolvedValue(null);
      await expect(service.validateUser('1234', 'pass')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return tokens and user', async () => {
      userService.getByPhoneNumber.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);
      userService.saveRefreshToken.mockResolvedValue(true);

      const result = await service.login({ phoneNumber: '12345678901', password: 'pass' });
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });
  });

  describe('registerUser', () => {
    it('should initiate registration flow', async () => {
      userService.getByPhoneNumber.mockResolvedValue(null);
      roleService.findByNames.mockResolvedValue([{ name: 'user' }]);
      redisService.saveData.mockResolvedValue(true);

      const payload: any = { phoneNumber: '12345678901', password: 'pass', roles: ['user'], name: 'Test' };
      const result = await service.registerUser(payload);

      expect(result).toHaveProperty('otpResponse');
      expect(redisService.saveData).toHaveBeenCalled();
    });

    it('should throw if phone exists', async () => {
        userService.getByPhoneNumber.mockResolvedValue(mockUser);
        const payload: any = { phoneNumber: '12345678901', password: 'pass', roles: ['user'], name: 'Test' };
        await expect(service.registerUser(payload)).rejects.toThrow(ConflictException);
    });
  });
  
  // Checking other key methods
  describe('sendOtpCode', () => {
      it('should send otp', async () => {
          redisService.getData.mockResolvedValue({ some: 'data' }); // session exists
          redisService.getOrInitializeCount.mockResolvedValue(1);
          otpService.sendOtp.mockResolvedValue(true);
          
          const result = await service.sendOtpCode('12345678901');
          expect(result.otpResponse).toBeDefined();
          expect(otpService.sendOtp).toHaveBeenCalled();
      });
  });
});
