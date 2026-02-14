import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { CollectionsService } from '../collections/collections.service';
import { CollectionEntity } from '../collections/entities/collection.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FilesController', () => {
    let controller: FilesController;
    let filesService: any;
    let collectionsService: any;

    beforeEach(async () => {
        filesService = {
            initUpload: jest.fn(),
            getPresignedPartUrl: jest.fn(),
            completeUpload: jest.fn(),
            getDownloadUrl: jest.fn(),
        };

        collectionsService = {
            findOne: jest.fn(),
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FilesController],
            providers: [
                {
                    provide: FilesService,
                    useValue: filesService,
                },
                {
                    provide: CollectionsService,
                    useValue: collectionsService,
                },
            ],
        }).compile();

        controller = module.get<FilesController>(FilesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('initUpload', () => {
        const caseId = 1;
        const files = [{ originalName: 'doc.pdf', size: 100, mimeType: 'app/pdf' }];

        it('should use existing collection if collectionId provided', async () => {
            const collectionId = 123;
            const collection = { id: 123, name: 'Existing' };
            collectionsService.findOne.mockResolvedValue(collection);
            filesService.initUpload.mockResolvedValue([]);

            await controller.initUpload(caseId, { collectionId, files });

            expect(collectionsService.findOne).toHaveBeenCalledWith(collectionId);
            expect(filesService.initUpload).toHaveBeenCalledWith(collection.id, files);
        });

        it('should create default collection if collectionId is missing', async () => {
            const newCollection = { id: 999, name: 'DefaultName' };
            collectionsService.create.mockResolvedValue(newCollection);
            filesService.initUpload.mockResolvedValue([]);

            // Call without collectionId
            await controller.initUpload(caseId, { files });

            expect(collectionsService.create).toHaveBeenCalledWith(caseId);
            expect(filesService.initUpload).toHaveBeenCalledWith(newCollection.id, files);
        });

        it('should throw BadRequest if no files provided', async () => {
            await expect(controller.initUpload(1, { files: [] } as any))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequest if collection not found', async () => {
            collectionsService.findOne.mockResolvedValue(null);
            await expect(controller.initUpload(1, { collectionId: 99, files }))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('getPartUrl', () => {
        it('should call service', async () => {
            filesService.getPresignedPartUrl.mockResolvedValue({ url: 'url' });
            expect(await controller.getPartUrl('uuid-123', 1)).toEqual({ url: 'url' });
        });
    });
    
    // Additional simple tests for completeUpload and download are straightforward
    describe('completeUpload', () => {
        it('should call service', async () => {
            const parts = [];
            const fileId = 'uuid-123';
            filesService.completeUpload.mockResolvedValue({});
            await controller.completeUpload(fileId, { parts });
            expect(filesService.completeUpload).toHaveBeenCalledWith(fileId, parts);
        });
    });

    describe('download', () => {
        it('should call service', async () => {
            filesService.getDownloadUrl.mockResolvedValue({ url: 'durl' });
            await controller.download('uuid-123');
            expect(filesService.getDownloadUrl).toHaveBeenCalledWith('uuid-123');
        });
    });
});
