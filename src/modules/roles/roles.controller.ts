import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Role } from './entities/roles.entity';
import { RoleDto } from './dtos/role.dto';
import { PatchRolePayload } from './dtos/patchRole.dto';
import { VALID_ROLE_FIELDS, ORDER_BY } from '../../shared/constants';
import { PaginationPayload } from '../app/pagination.payload';
import { PaginationResult } from '../app/paginationResult.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiBearerAuth()
@ApiTags('roles')
@Controller('api/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by role name',
  })
  @ApiQuery({
      name: 'sortBy',
      required: false,
      enum: VALID_ROLE_FIELDS,
  })
  @ApiQuery({
      name: 'orderBy',
      required: false,
      enum: ORDER_BY,
  })
  async getRoles(
      @Query() paginationPayload: PaginationPayload,
      @Query('search') search?: string,
      @Query('sortBy') sortBy?: string,
      @Query('orderBy') orderBy?: 'ASC' | 'DESC',
  ): Promise<PaginationResult> {
    return await this.rolesService.findAll(
        paginationPayload, 
        search, 
        sortBy, 
        orderBy
    );
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Get role by ID' })
  @ApiResponse({ status: 404, description: 'Role is not found' })
  async getRole(@Param('id', ParseIntPipe) id: number): Promise<Role> {
    console.log('09');
    return await this.rolesService.findOne(id);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate role' })
  async createRole(@Body() dto: RoleDto): Promise<Role> {
    return await this.rolesService.create(dto);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'Role is not found' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchRolePayload,
  ): Promise<Role> {
    return await this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Role deleted' })
  @ApiResponse({ status: 404, description: 'Role is not found' })
  async deleteRole(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return await this.rolesService.delete(id);
  }
}
