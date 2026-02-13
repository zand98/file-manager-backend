import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

/**
 * App Controller
 */
@ApiBearerAuth()
@Controller('/api')
export class AppController {
  /**
   * Constructor
   * @param {AppService} appService app service
   */
  constructor(private readonly appService: AppService) {}

  @Get('request/user')
  @ApiResponse({ status: 200, description: 'User Metadata Request Completed' })
  @ApiResponse({ status: 400, description: 'User Metadata Request Failed' })
  getRequestUser(@Req() req): Partial<Request> {
    return req.user;
  }
}
