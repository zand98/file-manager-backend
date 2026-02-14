import { Test, TestingModule } from '@nestjs/testing';
import { CasesService } from './cases.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CaseEntity } from './entities/case.entity';
import { NotFoundException } from '@nestjs/common';

// Define a type for the mock repository to ensure it matches the usage
type MockRepository<T = any> = Partial<Record<keyof T, jest.Mock>>;

describe('CasesService', () => {
  let service: CasesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: getRepositoryToken(CaseEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a case', async () => {
      const name = 'Test Case';
      const caseEntity = { id: 1, name, collections: [] };
      // `create` returns the entity instance from the DTO/object
      mockRepository.create.mockReturnValue(caseEntity);
      // `save` returns the persisted entity (often with ID generated)
      mockRepository.save.mockResolvedValue(caseEntity);

      const result = await service.create(name);

      expect(mockRepository.create).toHaveBeenCalledWith({ name });
      expect(mockRepository.save).toHaveBeenCalledWith(caseEntity);
      expect(result).toEqual(caseEntity);
    });
  });

  describe('findAll', () => {
    it('should return paginated cases with default sorting', async () => {
      const cases = [{ id: 1, name: 'Case 1', collections: [] }];
      mockRepository.findAndCount.mockResolvedValue([cases, 1]);

      const query = { page: 1, limit: 10 };
      const result = await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: ['collections', 'collections.files'],
        order: { updated_at: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({ data: cases, page: 1, limit: 10, totalCount: 1 });
    });

    it('should return paginated cases with custom sorting', async () => {
        const cases = [{ id: 1, name: 'Case 1', collections: [] }];
        mockRepository.findAndCount.mockResolvedValue([cases, 1]);
  
        const query = { page: 1, limit: 10, sortBy: 'name', orderBy: 'ASC' as const };
        const result = await service.findAll(query);
  
        expect(mockRepository.findAndCount).toHaveBeenCalledWith({
          where: {},
          relations: ['collections', 'collections.files'],
          order: { name: 'ASC' },
          skip: 0,
          take: 10,
        });
        expect(result).toEqual({ data: cases, page: 1, limit: 10, totalCount: 1 });
      });
  });

  describe('findOne', () => {
    it('should return a case if found', async () => {
      const id = 1;
      const caseEntity = { id, name: 'Case 1', collections: [] };
      mockRepository.findOne.mockResolvedValue(caseEntity);

      const result = await service.findOne(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: id }, // TypeORM findOne options
        relations: ['collections', 'collections.files'],
      });
      expect(result).toEqual(caseEntity);
    });

    it('should throw NotFoundException if not found', async () => {
      const id = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });
});
