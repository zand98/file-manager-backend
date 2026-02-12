import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/roles.entity';
import { RoleDto } from './dtos/role.dto';
import { PatchRolePayload } from './dtos/patchRole.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return await this.rolesRepository.find();
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async create(dto: RoleDto): Promise<Role> {
    const exists = await this.rolesRepository.findOneBy({ name: dto.name });
    if (exists) {
      throw new BadRequestException(`Role '${dto.name}' already exists.`);
    }

    const role = this.rolesRepository.create(dto);
    return await this.rolesRepository.save(role);
  }

  async update(id: number, dto: PatchRolePayload): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, dto);

    try {
      return await this.rolesRepository.save(role);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Role name must be unique.');
      }
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<{ message: string }> {
    const result = await this.rolesRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return { message: `Role with ID ${id} deleted successfully` };
  }

  async findByNames(roleNames: string[]): Promise<Role[]> {
    return this.rolesRepository.find({
      where: {
        name: In(roleNames),
      },
    });
  }
}
