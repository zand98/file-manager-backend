import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { MinioService } from '../minio/minio.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FilesService', () => {
  let service: FilesService;
  let mockFileRepository: any;
  let mockMinioService: any;

  beforeEach(async () => {
    // Mock File Repository
    mockFileRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    // Mock Minio Service
    mockMinioService = {
      initMultipartUpload: jest.fn(),
      getPresignedPartUrl: jest.fn(),
      completeMultipartUpload: jest.fn(),
      getPresignedDownloadUrl: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockFileRepository,
        },
        {
          provide: MinioService,
          useValue: mockMinioService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initUpload', () => {
    it('should initialize multipart upload for multiple files', async () => {
      const collectionId = 1;
      const filesData = [
        { originalName: 'file1.txt', size: 1024, mimeType: 'text/plain' },
        { originalName: 'file2.jpg', size: 2048, mimeType: 'image/jpeg' },
      ];
      
      const uploadId = 'test-upload-id';
      mockMinioService.initMultipartUpload.mockResolvedValue({ UploadId: uploadId });
      
      // Mock the create and save flow
      mockFileRepository.create.mockImplementation((dto) => ({ ...dto, id: 'uuid-' + Math.random() }));
      mockFileRepository.save.mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 'uuid-1' }));

      const result = await service.initUpload(collectionId, filesData);

      // Verify MinIO initialization calls
      expect(mockMinioService.initMultipartUpload).toHaveBeenCalledTimes(2);
      
      // Verify Repository calls
      // 2 files * (1 create + 1 save initial + 1 save update) = 6 calls to repo methods total?
      // Actually: create -> save (status pending) -> initMinio -> save (status uploading)
      expect(mockFileRepository.create).toHaveBeenCalledTimes(2);
      expect(mockFileRepository.save).toHaveBeenCalledTimes(4); 

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('fileId');
      expect(result[0]).toHaveProperty('uploadId', uploadId);
      expect(result[0]).toHaveProperty('key');
    });

    it('should rollback database entries if MinIO init fails', async () => {
      const collectionId = 1;
      const filesData = [{ originalName: 'fail.txt', size: 100, mimeType: 'text/plain' }];
      
      const fileEntity = { id: 'uuid-101', original_name: 'fail.txt' };

      mockFileRepository.create.mockReturnValue(fileEntity);
      mockFileRepository.save.mockResolvedValue(fileEntity); // First save success
      
      mockMinioService.initMultipartUpload.mockRejectedValue(new Error('MinIO Conn Error'));
      
      await expect(service.initUpload(collectionId, filesData))
        .rejects.toThrow(BadRequestException);
      
      // Crucial: check if cleanup happened
      expect(mockFileRepository.delete).toHaveBeenCalledWith('uuid-101');
    });
  });

  describe('getPresignedPartUrl', () => {
    it('should return a url', async () => {
      const fileId = 'uuid-1';
      const partNumber = 1;
      const file = { id: 'uuid-1', s3_key: 'key', upload_id: 'upId', status: 'uploading' };
      
      mockFileRepository.findOne.mockResolvedValue(file);
      mockMinioService.getPresignedPartUrl.mockResolvedValue('http://s3/url');

      const result = await service.getPresignedPartUrl(fileId, partNumber);
      
      expect(result).toEqual({ url: 'http://s3/url' });
      expect(mockMinioService.getPresignedPartUrl).toHaveBeenCalledWith('key', 'upId', partNumber);
    });

    it('should throw NotFound if file missing', async () => {
      mockFileRepository.findOne.mockResolvedValue(null);
      await expect(service.getPresignedPartUrl('uuid-1', 1)).rejects.toThrow(NotFoundException);
    });
  });

  // Additional coverage for completeUpload
  describe('completeUpload', () => {
    it('should complete and update status', async () => {
       const file = { id: 'uuid-1', s3_key: 'k', upload_id: 'u', status: 'uploading' };
       mockFileRepository.findOne.mockResolvedValue(file);
       mockMinioService.completeMultipartUpload.mockResolvedValue({});
       mockFileRepository.save.mockImplementation(f => f);

       const result = await service.completeUpload('uuid-1', []);
       expect(result.status).toBe('completed');
       expect(mockMinioService.completeMultipartUpload).toHaveBeenCalled();
    });
  });

  describe('getDownloadUrl', () => {
      it('should return url', async () => {
          const file = { id: 'uuid-1', s3_key: 'k' };
          mockFileRepository.findOne.mockResolvedValue(file);
          mockMinioService.getPresignedDownloadUrl.mockResolvedValue('url');
          expect(await service.getDownloadUrl('uuid-1')).toEqual({ url: 'url' });
      });
  });
});
