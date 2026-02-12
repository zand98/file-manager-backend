import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

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
}
