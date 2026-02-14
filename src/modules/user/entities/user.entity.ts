import { Exclude } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/modules/roles/entities/roles.entity';
import { IsPhoneNumber } from 'class-validator';
import { BaseTimestampEntity } from 'src/shared/entities/BaseTimestamp.entity';
/**
 * User Entity Class
 */
@Entity({
  name: 'user',
})
export class User extends BaseTimestampEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'users_roles', // explicit join table name
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({
    example: '07*********',
    description: 'User phone number',
    maximum: 11,
    minimum: 11,
    required: true,
  })
  @IsPhoneNumber()
  @Column({ length: 11, unique: true })
  phoneNumber: string;

  @Column()
  @Exclude() // This will exclude password from serialization
  password: string;

  @Column({ nullable: true })
  @Exclude() // Exclude by default, but service can access it
  refreshToken: string;

  @Column({ default: false })
  disabled: boolean;
}
