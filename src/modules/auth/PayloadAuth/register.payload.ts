import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  IsPhoneNumber,
  IsStrongPassword,
  Length,
  Validate,
} from 'class-validator';
import { RolesExistValidator } from 'src/modules/validators/roles-exist.validator';

export class RegisterPayload {
  @ApiProperty({ example: ['manager', 'user'], type: [String] })
  @IsArray()
  @IsNotEmpty()
  @Validate(RolesExistValidator) // Custom validator
  roles: string[];

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '07*********',
    description: '11 digit phone number',
    required: true,
  })
  @IsPhoneNumber('IQ') // Change to your country code
  @Length(11)
  phoneNumber: string;

  @ApiProperty({ minLength: 8, description: 'User password' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

}
