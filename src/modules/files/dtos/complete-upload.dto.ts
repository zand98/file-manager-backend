import { IsString, IsNumber, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PartDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ETag: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  PartNumber: number;
}

export class CompleteUploadDto {
  @ApiProperty({ type: [PartDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartDto)
  parts: PartDto[];
}
