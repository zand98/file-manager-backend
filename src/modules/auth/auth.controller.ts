import {
  Body,
  Controller,
  Post,
  Res,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginPayload } from './PayloadAuth/login.payload';
import { RegisterPayload } from './PayloadAuth/register.payload';
import { ResetPasswordDto } from './PayloadAuth/reset-password.dto';
import { SendOtpDto } from './PayloadAuth/send-otp.dto';
import { VerifyOtpDto } from './PayloadAuth/verify-otp.dto';
import { ForgetPasswordDto } from './PayloadAuth/forget-password.dto';
import { RefreshTokenDto } from './PayloadAuth/refresh-token.dto';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() payload: LoginPayload, @Res() res: Response) {
    const result = await this.authService.login(payload);
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('register')
  @ApiResponse({ status: 201, description: 'Registration successful or pending OTP' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async register(@Body() payload: RegisterPayload, @Res() res: Response) {
    const result = await this.authService.registerUser(payload);
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('send-otp')
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({ status: 400, description: 'Invalid phone number or expired session' })
  async sendOtp(@Body() dto: SendOtpDto, @Res() res: Response) {
    const result = await this.authService.sendOtpCode(dto.phoneNumber);
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('verify-otp')
  @ApiResponse({ status: 200, description: 'OTP verified' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or phone number' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res() res: Response) {
    const result = await this.authService.verifyOtpCode(dto.phoneNumber, dto.otpCode);
    
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('forget-password')
  @ApiResponse({ status: 200, description: 'Password reset initiated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgetPassword(@Body() dto: ForgetPasswordDto, @Res() res: Response) {
    const result = await this.authService.forgetPassword(dto.phoneNumber, dto.newPassword);
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('refresh-token')
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async refreshToken(@Body() dto: RefreshTokenDto, @Res() res: Response) {
    const result = await this.authService.refreshToken(dto.accessToken, dto.refreshToken);
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Res() res: Response) {
    const user = await this.authService.resetPasswordWithVerification(dto);
     // remove password
     delete user.password;
     delete user.refreshToken;
     return res.status(HttpStatus.OK).json(user);
  }
}
