import { Test, TestingModule } from '@nestjs/testing';
import { MinioService } from './minio.service';
import { ConfigService } from '../config/config.service';
import { 
  S3Client, 
  CreateBucketCommand,
  HeadBucketCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('MinioService', () => {
  let service: MinioService;
  let mockS3Client: any;
  let mockConfigService: any;

  beforeEach(async () => {
    // Mock S3Client methods
    mockS3Client = {
      send: jest.fn(),
    };

    // Mock ConfigService
    mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          MINIO_ENDPOINT: 'localhost',
          MINIO_PORT: '9000',
          MINIO_ACCESS_KEY: 'minioadmin',
          MINIO_SECRET_KEY: 'minioadmin',
          MINIO_BUCKET_NAME: 'test-bucket',
        };
        return config[key];
      }),
    };

    // Mock S3Client constructor
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);

    // Mock the initial bucket check that happens in constructor
    mockS3Client.send.mockResolvedValueOnce({}); // ensureBucketExists succeeds

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MinioService>(MinioService);
    
    // Clear the mock after initialization
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureBucketExists', () => {
    it('should not create bucket if it already exists', async () => {
      // Mock successful head bucket (bucket exists)
      mockS3Client.send.mockResolvedValueOnce({});

      await service.ensureBucketExists();

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(HeadBucketCommand));
    });

    it('should create bucket if it does not exist', async () => {
      // Mock head bucket failure (404)
      const notFoundError = new Error('NotFound');
      notFoundError.name = 'NotFound';
      mockS3Client.send.mockRejectedValueOnce(notFoundError);

      // Mock successful bucket creation
      mockS3Client.send.mockResolvedValueOnce({});

      await service.ensureBucketExists();

      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
      expect(mockS3Client.send).toHaveBeenNthCalledWith(1, expect.any(HeadBucketCommand));
      expect(mockS3Client.send).toHaveBeenNthCalledWith(2, expect.any(CreateBucketCommand));
    });

    it('should log error if bucket creation fails', async () => {
      const notFoundError = new Error('NotFound');
      notFoundError.name = 'NotFound';
      mockS3Client.send.mockRejectedValueOnce(notFoundError);

      // Mock bucket creation failure
      mockS3Client.send.mockRejectedValueOnce(new Error('Creation failed'));

      // The actual implementation catches and logs the error instead of throwing
      await expect(service.ensureBucketExists()).resolves.toBeUndefined();
      expect(mockS3Client.send).toHaveBeenCalledTimes(2); // HeadBucket + CreateBucket attempt
    });
  });

  describe('initMultipartUpload', () => {
    it('should initialize multipart upload and return uploadId', async () => {
      const key = 'test-file.txt';
      const contentType = 'text/plain';
      const uploadId = 'mock-upload-id-123';

      mockS3Client.send.mockResolvedValueOnce({ UploadId: uploadId });

      const result = await service.initMultipartUpload(key, contentType);

      expect(result).toEqual({ UploadId: uploadId });
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      mockS3Client.send.mockRejectedValueOnce(new Error('S3 Error'));

      await expect(service.initMultipartUpload('key', 'type')).rejects.toThrow('S3 Error');
    });
  });

  describe('getPresignedPartUrl', () => {
    it('should generate presigned URL for upload part', async () => {
      const key = 'test-file.txt';
      const uploadId = 'upload-123';
      const partNumber = 1;
      const mockUrl = 'https://minio.example.com/presigned-url';

      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      const result = await service.getPresignedPartUrl(key, uploadId, partNumber);

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(UploadPartCommand),
        { expiresIn: 3600 },
      );
    });

    it('should handle presigned URL generation errors', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('Presign failed'));

      await expect(service.getPresignedPartUrl('key', 'uploadId', 1)).rejects.toThrow(
        'Presign failed',
      );
    });
  });

  describe('completeMultipartUpload', () => {
    it('should complete multipart upload with parts', async () => {
      const key = 'test-file.txt';
      const uploadId = 'upload-123';
      const parts = [
        { ETag: 'etag1', PartNumber: 1 },
        { ETag: 'etag2', PartNumber: 2 },
      ];

      mockS3Client.send.mockResolvedValueOnce({
        Location: 'https://bucket.s3.amazonaws.com/key',
        ETag: 'final-etag',
      });

      const result = await service.completeMultipartUpload(key, uploadId, parts);

      expect(result).toHaveProperty('Location');
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle completion errors', async () => {
      mockS3Client.send.mockRejectedValueOnce(new Error('Complete failed'));

      await expect(
        service.completeMultipartUpload('key', 'uploadId', []),
      ).rejects.toThrow('Complete failed');
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should generate presigned download URL', async () => {
      const key = 'test-file.txt';
      const mockUrl = 'https://minio.example.com/download-url';

      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      const result = await service.getPresignedDownloadUrl(key);

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 3600 },
      );
    });

    it('should handle download URL generation errors', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('Download URL failed'));

      await expect(service.getPresignedDownloadUrl('key')).rejects.toThrow('Download URL failed');
    });
  });

  describe('delete', () => {
    it('should delete object from bucket', async () => {
      const key = 'test-file.txt';

      mockS3Client.send.mockResolvedValueOnce({});

      await service.delete(key);

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion errors gracefully', async () => {
      // The actual implementation catches errors and logs them instead of throwing
      mockS3Client.send.mockRejectedValueOnce(new Error('Delete failed'));

      // Should not throw - just logs the error
      await expect(service.delete('key')).resolves.toBeUndefined();
      expect(mockS3Client.send).toHaveBeenCalled();
    });
  });
});
