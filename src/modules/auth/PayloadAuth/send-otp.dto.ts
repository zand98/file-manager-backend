import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, Length } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    example: '07*********',
    description: '11 digit phone number',
    required: true,
  })
  @IsPhoneNumber('IQ') // Adjust region if needed, or remove region for generic
  @Length(11)
  @IsNotEmpty()
  phoneNumber: string;
}
