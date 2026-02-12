import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/roles.entity';

@ValidatorConstraint({ name: 'RolesExist', async: true })
@Injectable()
export class RolesExistValidator implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async validate(roleNames: string[]): Promise<boolean> {
    if (!Array.isArray(roleNames) || roleNames.length === 0) return false;

    const count = await this.roleRepository.count({
      where: roleNames.map((name) => ({ name })),
    });

    return count === roleNames.length;
  }

  defaultMessage(): string {
    return 'One or more specified roles do not exist in the system';
  }
}
