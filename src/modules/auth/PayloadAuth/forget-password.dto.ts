import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length, IsStrongPassword } from 'class-validator';

export class ForgetPasswordDto {
  @ApiProperty({ example: '07*********', description: '11 digit phone number' })
  @IsNotEmpty()
  @Length(11)
  phoneNumber: string;

  @ApiProperty({ minLength: 8 })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsNotEmpty()
  newPassword: string;
}
