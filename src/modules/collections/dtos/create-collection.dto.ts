import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;
}
