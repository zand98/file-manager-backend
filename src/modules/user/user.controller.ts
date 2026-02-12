import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
// import { PatchUserPayload } from './dtos/patch.user.payload';
import { User } from './entities/user.entity';
import { PaginationPayload } from '../app/pagination.payload';
import { PaginationResult } from '../app/paginationResult.interface';
import { PatchUserPayload } from './dtos/patch.user.payload';
/**
 * User Controller
 */
@ApiBearerAuth()
@ApiTags('User')
@Controller('api/user')
export class UserController {
  private i: number;

  constructor(private readonly userService: UserService) {
    this.i = 0;
  }

  @Get('')
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('admin', 'manager') // Simple role check
  @ApiResponse({ status: 400, description: 'Fetch Users Request Failed' })
  async getUsers(
    @Query() paginationPayload: PaginationPayload,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('orderBy') orderBy?: string,
  ): Promise<PaginationResult> {
    this.i++;
    console.log('Request number =>', this.i);
    const order = {};
    let Users;
    if (!paginationPayload.limit || !paginationPayload.page) {
      paginationPayload = {
        limit: 100,
        page: 1,
      };
    }
    if (sortBy && orderBy) {
      order[sortBy] = orderBy;
    }
    if (!sortBy || !orderBy) {
      order['user.id'] = 'ASC';
    }

    Users = await this.userService.getAll(
      paginationPayload,
      order,
      search ? search : undefined,
    );

    if (!Users) {
      throw new BadRequestException('No Users were found.');
    }
    return Users;
  }
  /**
   * Retrieves a particular User
   * @param Username the User given Username to fetch
   * @returns {Promise<User>} queried User data
   */

  @Get(':userToken')
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Fetch User Request Received',
  })
  @ApiResponse({ status: 400, description: 'Fetch User Request Failed' })
  async getByUserToken(@Param('userToken') userToken: any): Promise<User> {
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
  @ApiResponse({ status: 200, description: 'Patch User Request Received' })
  @ApiResponse({ status: 400, description: 'Patch User Request Failed' })
  async patchUser(
    @Body() payload: PatchUserPayload,
    @Param('userToken') userToken: string,
  ): Promise<User> {
    return await this.userService.editByToken(userToken, payload);
  }

  @Patch('phoneNumber/:phoneNumber')
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
  @ApiResponse({ status: 200, description: 'Delete User Request Received' })
  @ApiResponse({ status: 400, description: 'Delete User Request Failed' })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    return await this.userService.delete(id);
  }
}
