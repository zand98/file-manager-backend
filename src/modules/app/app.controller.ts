import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/**
 * App Controller
 */
@ApiBearerAuth()
@Controller('/api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppController {
  /**
   * Constructor
   * @param {AppService} appService app service
   */
  constructor(private readonly appService: AppService) {}

  @Get('request/user')
  @Roles('admin', 'user')
  @ApiResponse({ status: 200, description: 'User Metadata Request Completed' })
  @ApiResponse({ status: 400, description: 'User Metadata Request Failed' })
  getRequestUser(@Req() req): Partial<Request> {
    return req.user;
  }
}
