import { IsString, IsNumber, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class FileMetaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsNumber()
  size: number;
}

export class InitUploadDto {
  @ApiProperty({ type: [FileMetaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileMetaDto)
  files: FileMetaDto[];
}
