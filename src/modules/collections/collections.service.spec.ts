import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CollectionEntity } from './entities/collection.entity';
import { CaseEntity } from '../cases/entities/case.entity';
import { FilesService } from '../files/files.service';
import { NotFoundException } from '@nestjs/common';

describe('CollectionsService', () => {
    let service: CollectionsService;
    let mockCollectionRepository: any;
    let mockCaseRepository: any;

    beforeEach(async () => {
        mockCollectionRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            delete: jest.fn(),
        };

        mockCaseRepository = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CollectionsService,
                {
                    provide: getRepositoryToken(CollectionEntity),
                    useValue: mockCollectionRepository,
                },
                {
                    provide: getRepositoryToken(CaseEntity),
                    useValue: mockCaseRepository,
                },
                {
                    provide: FilesService, // MOCKING THE FILES SERVICE
                    useValue: {
                        delete: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CollectionsService>(CollectionsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a collection with provided name', async () => {
            const caseId = 1;
            const name = 'My Collection';
            const caseEntity = { id: caseId, name: 'Case' };
            const newCollection = { id: 10, name, case: caseEntity };

            mockCaseRepository.findOne.mockResolvedValue(caseEntity);
            mockCollectionRepository.create.mockReturnValue(newCollection);
            mockCollectionRepository.save.mockResolvedValue(newCollection);

            const result = await service.create(caseId, name);

            expect(mockCollectionRepository.create).toHaveBeenCalledWith({ name, case: caseEntity });
            expect(result).toEqual(newCollection);
        });

        it('should create a default name if none provided', async () => {
            const caseId = 1;
            const caseEntity = { id: caseId };
            
            mockCaseRepository.findOne.mockResolvedValue(caseEntity);
            mockCollectionRepository.create.mockImplementation(dto => dto);
            mockCollectionRepository.save.mockImplementation(e => e);

            const result = await service.create(caseId);

            expect(result.name).toBeDefined();
            // Should be a date string, roughly
            expect(new Date(result.name).toString()).not.toBe('Invalid Date'); 
        });

        it('should throw NotFound if case missing', async () => {
            mockCaseRepository.findOne.mockResolvedValue(null);
            await expect(service.create(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAllByCase', () => {
        it('should return collections for a case', async () => {
            const caseId = 1;
            const list = [{ id: 1, name: 'Col 1' }];
            const paginationPayload = { page: 1, limit: 10 };

            mockCollectionRepository.findAndCount.mockResolvedValue([list, 1]);

            const result = await service.findAllByCase(caseId, paginationPayload);
            
            expect(mockCollectionRepository.findAndCount).toHaveBeenCalledWith({
                where: { case: { id: caseId } },
                relations: ['files'],
                order: { updated_at: 'DESC' },
                skip: 0,
                take: 10,
            });
            expect(result).toEqual({
                data: list,
                page: 1,
                limit: 10,
                totalCount: 1,
            });
        });
    });

    describe('findOne', () => {
        it('should return collection', async () => {
            const col = { id: 1 };
            mockCollectionRepository.findOne.mockResolvedValue(col);
            expect(await service.findOne(1)).toEqual(col);
        });
    });

    describe('delete', () => {
        it('should delete a collection', async () => {
            mockCollectionRepository.delete.mockResolvedValue({ affected: 1 });
            await service.delete(1);
            expect(mockCollectionRepository.delete).toHaveBeenCalledWith(1);
        });
    });
});
