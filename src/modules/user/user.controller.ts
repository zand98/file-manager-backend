import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
// import { PatchUserPayload } from './dtos/patch.user.payload';
import { User } from './entities/user.entity';
import { PaginationPayload } from '../app/pagination.payload';
import { PaginationResult } from '../app/paginationResult.interface';
import { PatchUserPayload } from './dtos/patch.user.payload';
import { VALID_USER_FIELDS, ORDER_BY } from '../../shared/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
/**
 * User Controller
 */
@ApiBearerAuth()
@ApiTags('User')
@Controller('api/user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  private i: number;

  constructor(private readonly userService: UserService) {
    this.i = 0;
  }

  @Get('')
  @Roles('admin', 'user')
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Fetch Users Request Failed' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by user name or phone number',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: VALID_USER_FIELDS,
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ORDER_BY,
  })
  async getUsers(
    @Query() paginationPayload: PaginationPayload,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('orderBy') orderBy?: 'ASC' | 'DESC',
  ): Promise<PaginationResult> {
    this.i++;
    console.log('Request number =>', this.i);

    return await this.userService.getAll(
      paginationPayload,
      search,
      sortBy,
      orderBy,
    );
  }
  /**
   * Retrieves a particular User
   * @param userToken the User given userToken to fetch
   * @returns {Promise<User>} queried User data
   */

  @Get(':userToken')
  @Roles('admin')
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Fetch User Request Received',
  })
  @ApiResponse({ status: 400, description: 'Fetch User Request Failed' })
  @ApiParam({ name: 'userToken', required: true, description: 'User Token' })
  async getByUserToken(@Param('userToken') userToken: string): Promise<User> {
    const relations = [];
    const user = await this.userService.getByUserToken(userToken, relations);

    if (!user) {
      throw new BadRequestException(
        'The User with that user token could not be found.',
      );
    }
    return user;
  }

  @Patch('token/:userToken')
  @Roles('admin')
  @ApiResponse({ status: 200, description: 'Patch User Request Received' })
  @ApiResponse({ status: 400, description: 'Patch User Request Failed' })
  @ApiParam({ name: 'userToken', required: true })
  async patchUser(
    @Body() payload: PatchUserPayload,
    @Param('userToken') userToken: string,
  ): Promise<User> {
    return await this.userService.editByToken(userToken, payload);
  }

  @Patch('phoneNumber/:phoneNumber')
  @Roles('admin')
  @ApiParam({ name: 'phoneNumber', required: true })
  async patchUserByphoneNumber(
    @Body() payload: PatchUserPayload,
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<User> {
    // Fix: Call correct service method
    const user = await this.userService.editByPhoneNumber(phoneNumber, payload);
    if (!user) {
      throw new BadRequestException('User update failed');
    }
    return user;
  }

  @Delete(':id')
  @Roles('admin')
  @ApiResponse({ status: 200, description: 'Delete User Request Received' })
  @ApiResponse({ status: 400, description: 'Delete User Request Failed' })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    return await this.userService.delete(id);
  }
}
