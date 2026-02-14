import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dtos/create-collection.dto';
import { CollectionEntity } from './entities/collection.entity';
import { NotFoundException } from '@nestjs/common';

describe('CollectionsController', () => {
    let controller: CollectionsController;
    let service: any;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findAllByCase: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CollectionsController],
            providers: [
                {
                    provide: CollectionsService,
                    useValue: service,
                },
            ],
        }).compile();

        controller = module.get<CollectionsController>(CollectionsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a collection', async () => {
            const dto: CreateCollectionDto = { name: 'New Col' };
            const col = { id: 1, name: 'New Col' };
            service.create.mockResolvedValue(col);

            expect(await controller.create(1, dto)).toEqual(col);
            expect(service.create).toHaveBeenCalledWith(1, dto.name);
        });
    });

    describe('findOne', () => {
        it('should return collection', async () => {
            const col = { id: 1 };
            service.findOne.mockResolvedValue(col);
            expect(await controller.findOne(1)).toEqual(col);
        });

        it('should throw NotFound if missing', async () => {
            service.findOne.mockResolvedValue(null);
            await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete', async () => {
            await controller.delete(1);
            expect(service.delete).toHaveBeenCalledWith(1);
        });
    });

    describe('findAll', () => {
        it('should list by case', async () => {
            const list = [];
            const paginationResult = {
                data: list,
                page: 1,
                limit: 10,
                totalCount: 0,
            };
            service.findAllByCase.mockResolvedValue(paginationResult);
            expect(await controller.findAll(1, { page: 1, limit: 10 }, undefined, undefined, undefined)).toEqual(paginationResult);
            expect(service.findAllByCase).toHaveBeenCalledWith(1, { page: 1, limit: 10 }, undefined, undefined, undefined);
        });
    });
});
