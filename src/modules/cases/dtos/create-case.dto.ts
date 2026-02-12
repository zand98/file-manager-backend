import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCaseDto {
  @ApiProperty({ example: 'My Case' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
