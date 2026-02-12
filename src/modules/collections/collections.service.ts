import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from './entities/collection.entity';
import { CaseEntity } from 'src/modules/cases/entities/case.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(CaseEntity)
    private readonly caseRepository: Repository<CaseEntity>,
  ) {}

  async create(caseId: number, name?: string): Promise<CollectionEntity> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } as any });
    if (!caseEntity) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    const validName = name || new Date().toLocaleString();
    const newCollection = this.collectionRepository.create({
      name: validName,
      case: caseEntity,
    });
    return this.collectionRepository.save(newCollection);
  }

  async findOne(id: number): Promise<CollectionEntity> {
    const col = await this.collectionRepository.findOne({
      where: { id: id } as any,
    });
    return col;
  }

  async findAllByCase(caseId: number): Promise<CollectionEntity[]> {
    return this.collectionRepository.find({
      where: { case: { id: caseId } } as any,
      relations: ['files'],
      order: { updated_at: 'DESC' },
    });
  }

  async delete(id: number): Promise<void> {
    // 1. Fetch collection with files
    const collection = await this.collectionRepository.findOne({
        where: { id } as any,
        relations: ['files'],
    });

    await this.collectionRepository.delete(id);
  }
}
