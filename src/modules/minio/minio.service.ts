import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  UploadPartCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class MinioService {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(MinioService.name);

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME') || 'file-explorer';

    const endPoint = this.configService.get('MINIO_ENDPOINT') || 'localhost';
    const port = parseInt(this.configService.get('MINIO_PORT')) || 9000;
    const accessKey = this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin';
    const secretKey = this.configService.get('MINIO_SECRET_KEY') || 'minioadmin';

    // MinIO endpoint usually requires http:// prefix if not standard aws
    const endpointUrl = `http://${endPoint}:${port}`;

    this.s3Client = new S3Client({
      region: 'us-east-1', // MinIO requires a region but ignores it, usually 'us-east-1'
      endpoint: endpointUrl,
      forcePathStyle: true, // Needed for MinIO
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    this.ensureBucketExists();
  }

  async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch (e) {
      this.logger.log(`Bucket ${this.bucketName} not found, creating...`);
      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
        this.logger.log(`Bucket ${this.bucketName} created.`);
      } catch (createError) {
        this.logger.error(`Failed to create bucket: ${createError.message}`);
      }
    }
  }

  async initMultipartUpload(key: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    return this.s3Client.send(command);
  }

  async getPresignedPartUrl(key: string, uploadId: string, partNumber: number) {
    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    // Expires in 1 hour
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });
    return this.s3Client.send(command);
  }

  async abortMultipartUpload(key: string, uploadId: string) {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
    });
    return this.s3Client.send(command);
  }

  async getPresignedDownloadUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async delete(key: string) {
    const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
    });
    try {
        await this.s3Client.send(command);
    } catch(e) {
        this.logger.error(`Failed to delete object from S3: ${key}`, e);
        // We catch here so the upstream delete process doesn't halt completely if one file is missing/error
    }
  }
}
