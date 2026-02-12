import { Test, TestingModule } from '@nestjs/testing';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { CaseEntity } from './entities/case.entity';
import { CreateCaseDto } from './dtos/create-case.dto';

describe('CasesController', () => {
    let controller: CasesController;
    let service: CasesService;

    const mockCase: CaseEntity = { id: 1, name: 'Case 1', created_at: new Date(), updated_at: new Date(), deleted_at: null };

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
        it('should return an array of cases', async () => {
            const arr = [mockCase];
            mockService.findAll.mockResolvedValue(arr);
            expect(await controller.findAll()).toEqual(arr);
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
