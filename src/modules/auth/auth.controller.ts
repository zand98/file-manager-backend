import {
  Body,
  Controller,
  Post,
  Res,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';

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

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.APP_ENV === 'prod';

    // Access Token: Standard path, httpOnly, shorter life
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15m
    });

    // Refresh Token: Auth path only, httpOnly, longer life
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/auth/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
  }

  @Post('login')
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() payload: LoginPayload, @Res() res: Response) {
    const result = await this.authService.login(payload);
    this.setCookies(res, result.accessToken, result.refreshToken);

    // Remove tokens from body response
    delete result.accessToken;
    delete result.refreshToken;

    return res.status(HttpStatus.OK).json(result);
  }

  @Post('register')
  @ApiResponse({
    status: 201,
    description: 'Registration successful or pending OTP',
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async register(@Body() payload: RegisterPayload, @Res() res: Response) {
    const result = await this.authService.registerUser(payload);
    if (result.accessToken && result.refreshToken) {
      this.setCookies(res, result.accessToken, result.refreshToken);
      delete result.accessToken;
      delete result.refreshToken;
    }
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('send-otp')
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone number or expired session',
  })
  async sendOtp(@Body() dto: SendOtpDto, @Res() res: Response) {
    const result = await this.authService.sendOtpCode(dto.phoneNumber);
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('verify-otp')
  @ApiResponse({ status: 200, description: 'OTP verified' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or phone number' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res() res: Response) {
    const result = await this.authService.verifyOtpCode(
      dto.phoneNumber,
      dto.otpCode,
    );

    if (result.accessToken && result.refreshToken) {
      this.setCookies(res, result.accessToken, result.refreshToken);
      delete result.accessToken;
      delete result.refreshToken;
    }

    return res.status(HttpStatus.OK).json(result);
  }

  @Post('forget-password')
  @ApiResponse({ status: 200, description: 'Password reset initiated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgetPassword(@Body() dto: ForgetPasswordDto, @Res() res: Response) {
    const result = await this.authService.forgetPassword(
      dto.phoneNumber,
      dto.newPassword,
    );
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('refresh-token')
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    const accessToken = req.cookies?.accessToken || ''; 
    if (!refreshToken)
      throw new UnauthorizedException('No refresh token provided');

    const result = await this.authService.refreshToken(
      accessToken,
      refreshToken,
    );

    this.setCookies(res, result.accessToken, result.refreshToken);
    delete result.accessToken;
    delete result.refreshToken;

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
