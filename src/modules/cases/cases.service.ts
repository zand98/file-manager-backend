import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { PaginationResult } from '../app/paginationResult.interface';
import { CaseEntity } from './entities/case.entity';
import { PaginationPayload } from '../app/pagination.payload';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(CaseEntity)
    private readonly caseRepository: Repository<CaseEntity>,
  ) {}

  async create(name: string): Promise<CaseEntity> {
    const newCase = this.caseRepository.create({ name });
    return this.caseRepository.save(newCase);
  }

  async findAll(
    paginationPayload: PaginationPayload,
    search?: string,
    sortBy?: string,
    orderBy?: 'ASC' | 'DESC',
  ): Promise<PaginationResult> {
    let { page = 1, limit = 10 } = paginationPayload;
    
    if (page < 1) page = 1;
    
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }

    const order: any = {};
    if (sortBy) {
        order[sortBy] = orderBy || 'DESC';
    } else {
        order.updated_at = 'DESC';
    }

    const [data, totalCount] = await this.caseRepository.findAndCount({
      where,
      relations: ['collections', 'collections.files'],
      order,
      skip,
      take: limit,
    });

    return {
      data,
      page,
      limit,
      totalCount,
    };
  }

  async findOne(id: number): Promise<CaseEntity> {
    const caseEntity = await this.caseRepository.findOne({
      where: { id } as any,
      relations: ['collections', 'collections.files'],
    });
    if (!caseEntity) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }
    // Sort collections by updated date desc
    if (caseEntity.collections) {
        caseEntity.collections.sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime();
            const dateB = new Date(b.updated_at || b.created_at).getTime();
            return dateB - dateA;
        });
    }
    return caseEntity;
  }
}
