import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CollectionEntity } from './entities/collection.entity';
import { CaseEntity } from 'src/modules/cases/entities/case.entity';
import { FilesService } from '../files/files.service';
import { PaginationPayload } from '../app/pagination.payload';
import { PaginationResult } from '../app/paginationResult.interface';

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

  async findAll(): Promise<CollectionEntity[]> {
    return this.collectionRepository.find({
      relations: ['files'],
      order: {
        updated_at: 'DESC',
      },
    });
  }

  async findAllByCase(
    caseId: number,
    paginationPayload: PaginationPayload,
    search?: string,
    sortBy?: string,
    orderBy?: 'ASC' | 'DESC',
  ): Promise<PaginationResult> {
    let { page = 1, limit = 10 } = paginationPayload;
    if (page < 1) page = 1;

    const skip = (page - 1) * limit;

    const where: any = { case: { id: caseId } };
    if (search) {
      where.name = Like(`%${search}%`);
    }

    const order: any = {};
    if (sortBy) {
        order[sortBy] = orderBy || 'DESC';
    } else {
        order.updated_at = 'DESC';
    }

    const [data, totalCount] = await this.collectionRepository.findAndCount({
      where,
      relations: ['files'],
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
