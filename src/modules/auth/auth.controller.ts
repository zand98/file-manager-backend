import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
  HttpStatus,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginPayload } from './PayloadAuth/login.payload';
import { RegisterPayload } from './PayloadAuth/register.payload';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ResetPasswordDto } from './PayloadAuth/reset-password.dto';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  // @UseGuards(LocalAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() payload: LoginPayload, @Res() res: Response) {
    try {
      const user = await this.authService.validateUser(
        payload.phoneNumber,
        payload.password,
      );

      delete user.password; // Remove password from user object
      const token = await this.authService.createToken(user);

      return res.status(HttpStatus.OK).json({
        user,
        token,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid login credentials');
    }
  }

  @Post('reset-password')
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token/old password or weak new password',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPasswordWithVerification(dto);
  }

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'manager') // Simple role check
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid registration data',
  })
  async register(@Body() payload: RegisterPayload, @Res() res: Response) {
    const user = await this.authService.registerUser(payload);
    const token = await this.authService.createToken(user);

    delete user.password; // Remove password from user object

    res.status(HttpStatus.CREATED).json({
      ...token,
      user,
    });
  }

  @Post('refresh-token')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  async refreshToken(@Body('token') token: string, @Res() res: Response) {
    const newToken = await this.authService.refreshToken(token);
    res.status(HttpStatus.OK).json(newToken);
  }
}
