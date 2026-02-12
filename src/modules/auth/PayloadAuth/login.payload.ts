import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsStrongPassword,
  Length,
} from 'class-validator';

/**
 * Login Payload Class
 */
export class LoginPayload {
  @ApiProperty({
    example: '07812345678',
    description: '11-digit phone number (Iraq format)',
    required: true,
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber('IQ', { message: 'Invalid phone number format' }) // Change 'IQ' as needed
  @Length(11, 11, { message: 'Phone number must be exactly 11 digits' })
  phoneNumber: string;

  @ApiProperty({
    minLength: 8,
    description: 'User password',
    required: true,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword(undefined, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol',
  })
  password: string;
}
