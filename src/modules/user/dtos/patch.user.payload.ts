import { ApiProperty, PartialType } from '@nestjs/swagger';
import { RegisterPayload } from '../../auth/PayloadAuth/register.payload';

export class PatchUserPayload extends PartialType(RegisterPayload) {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  disabled?: boolean;
}
