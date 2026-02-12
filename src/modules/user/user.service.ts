import * as bcrypt from 'bcrypt';
import { classToPlain, Exclude, Expose } from 'class-transformer';
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginationPayload } from '../app/pagination.payload';
import { PaginationResult } from '../app/paginationResult.interface';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../roles/entities/roles.entity';
import { User } from '../user/entities/user.entity';
import { PatchUserPayload } from '../user/dtos/patch.user.payload';

@Injectable()
export class UserService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @Inject(forwardRef(() => JwtService))
    private readonly jwtService: JwtService,
  ) {}

  async getAll(
    paginationPayload: PaginationPayload,
    order?: any,
    search?: string,
  ): Promise<PaginationResult> {
    const skippedItems = (paginationPayload.page - 1) * paginationPayload.limit;

    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .skip(skippedItems)
      .take(paginationPayload.limit);

    if (order) {
      query.orderBy(order);
    }

    if (search) {
      query.where('user.phoneNumber LIKE :search OR user.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, totalCount] = await query.getManyAndCount();

    return {
      data: data,
      limit: paginationPayload.limit,
      page: paginationPayload.page,
      totalCount,
    };
  }

  async getByPhoneNumber(
    phoneNumber: string,
    relations: string[] = [],
  ): Promise<User | null> {
    if (!phoneNumber || phoneNumber.length !== 11) return null;
    return this.userRepository.findOne({
      where: { phoneNumber },
      relations: [...relations, 'roles'],
    });
  }

  async getById(id: number, relations: string[] = []): Promise<User | null> {
    if (!id) return null;
    return this.userRepository.findOne({
      where: { id },
      relations: [...relations, 'roles'],
    });
  }

  async getByUserToken(token: string, relations?: any[]): Promise<User | null> {
    const decoded = this.jwtService.decode(token);
    if (!decoded || typeof decoded !== 'object' || !('sub' in decoded)) {
      throw new BadRequestException('Invalid token structure');
    }

    return await this.userRepository.findOne({
      where: { id: decoded.sub },
      relations,
    });
  }

  async create(userData: {
    phoneNumber: string;
    password: string;
    name: string;
    disabled?: boolean;
    roles: Role[]; // Now accepts Role[] directly
  }): Promise<User> {
    const newUser = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(newUser);

    return savedUser;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    // 1. Find the existing user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'], // Include relations if needed
    });

    if (!user) {
      throw new BadRequestException('User is not found');
    }

    // 2. Update only the password field
    user.password = await bcrypt.hash(newPassword, this.saltRounds);

    // 3. Save the updated user
    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }

  async editByToken(token: string, payload: PatchUserPayload): Promise<User> {
    const user = await this.getByUserToken(token, ['roles', 'cities']);
    delete user?.password;
    if (!user) {
      throw new BadRequestException('User is not found');
    }

    // Validate and process roles
    if (payload?.roles) {
      user.roles = await this.roleRepository.find({
        where: { name: In(payload.roles) },
      });
      delete payload.roles;
    }

    // Prevent ID overwrite
    delete payload?.id;
    delete payload?.password;

    try {
      Object.assign(user, payload);
      const updatedUser = await this.userRepository.save(user);
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async editByPhoneNumber(
    phoneNumber: string,
    payload: PatchUserPayload,
  ): Promise<User> {
    const user = await this.getByPhoneNumber(phoneNumber, ['']);
    if (!user) {
      throw new BadRequestException('User is not found');
    }

    if (payload.roles) {
      user.roles = await this.roleRepository.find({
        where: { name: In(payload.roles) },
      });
      delete payload.roles;
    }

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, this.saltRounds);
    }

    try {
      Object.assign(user, payload);
      const updatedUser = await this.userRepository.save(user);
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<{ message: string }> {
    const result = await this.userRepository.softDelete(id);
    if (result.affected === 1) {
      return { message: 'User deleted successfully' };
    }
    throw new BadRequestException('Failed to delete user');
  }

  async userHasRole(userId: number, roleName: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    return user?.roles?.some((role) => role.name === roleName) ?? false;
  }

  async findByIds(ids: number[], relations: string[]): Promise<User[]> {
    return this.userRepository.find({
      where: { id: In(ids) },
      relations: relations,
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
