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
    it('should return an array of cases with relations', async () => {
      const cases = [{ id: 1, name: 'Case 1', collections: [] }];
      mockRepository.find.mockResolvedValue(cases);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['collections', 'collections.files'],
        order: { updated_at: 'DESC' },
      });
      expect(result).toEqual(cases);
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
