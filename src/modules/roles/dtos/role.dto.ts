import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Create Role DTO
 */
export class RoleDto {
  @ApiProperty({
    description: 'Role name (must be unique)',
    example: 'admin',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
