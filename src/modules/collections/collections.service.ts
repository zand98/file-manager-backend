import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from './entities/collection.entity';
import { CaseEntity } from 'src/modules/cases/entities/case.entity';
import { FilesService } from '../files/files.service';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(CaseEntity)
    private readonly caseRepository: Repository<CaseEntity>,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
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
      relations: ['files'],
    });
    if (col && col.files) {
        col.files.sort((a,b) => {
             const dateA = new Date(a.updated_at || a.created_at).getTime();
             const dateB = new Date(b.updated_at || b.created_at).getTime();
             return dateB - dateA;
        });
    }
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

    // 2. Delete files from storage AND database
    if (collection && collection.files) {
        for (const file of collection.files) {
             await this.filesService.delete(file.id);
        }
    }

    // 3. Finally delete the collection record
    await this.collectionRepository.delete(id);
  }
}
