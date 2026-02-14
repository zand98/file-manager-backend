import { Test, TestingModule } from '@nestjs/testing';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { CaseEntity } from './entities/case.entity';
import { CollectionEntity } from '../collections/entities/collection.entity';
import { CreateCaseDto } from './dtos/create-case.dto';

describe('CasesController', () => {
    let controller: CasesController;
    let service: CasesService;

    // Define mock data
    const mockCase: CaseEntity = { id: 1, name: 'Case 1', created_at: new Date(), updated_at: new Date(), deleted_at: null, collections: [] };

    const mockService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CasesController],
            providers: [
                {
                    provide: CasesService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<CasesController>(CasesController);
        service = module.get<CasesService>(CasesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a new case', async () => {
            const createCaseDto: CreateCaseDto = { name: 'New Case' };
            const result = new CaseEntity();
            result.id = 1;
            result.name = createCaseDto.name;

            mockService.create.mockResolvedValue(result);

            expect(await controller.create(createCaseDto)).toEqual(result);
            expect(mockService.create).toHaveBeenCalledWith(createCaseDto.name);
        });
    });

    describe('findAll', () => {
        it('should return a paginated result of cases', async () => {
            const arr = [mockCase];
            const paginationResult = {
                data: arr,
                page: 1,
                limit: 10,
                totalCount: 1,
            };
            mockService.findAll.mockResolvedValue(paginationResult);
            expect(await controller.findAll({ page: 1, limit: 10 }, undefined, undefined, undefined)).toEqual(paginationResult);
        });
    });

    describe('findOne', () => {
        it('should return a single case', async () => {
            mockService.findOne.mockResolvedValue(mockCase);
            expect(await controller.findOne(1)).toEqual(mockCase);
            expect(mockService.findOne).toHaveBeenCalledWith(1);
        });
    });
});
