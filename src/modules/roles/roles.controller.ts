import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Role } from './entities/roles.entity';
import { RoleDto } from './dtos/role.dto';
import { PatchRolePayload } from './dtos/patchRole.dto';

@ApiBearerAuth()
@ApiTags('roles')
@Controller('api/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'List all roles' })
  async getRoles(): Promise<Role[]> {
    return await this.rolesService.findAll();
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
