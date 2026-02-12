import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseEntity } from './entities/case.entity';

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

  async findAll(): Promise<CaseEntity[]> {
    return this.caseRepository.find({ 
        relations: ['collections', 'collections.files'],
        order: { updated_at: 'DESC' }
    });
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
