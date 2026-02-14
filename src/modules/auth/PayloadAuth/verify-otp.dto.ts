import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '07*********', description: '11 digit phone number' })
  @IsNotEmpty()
  @Length(11)
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: '6 digit OTP code' })
  @IsNotEmpty()
  @Length(6, 6)
  otpCode: string;
}
