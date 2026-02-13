import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity, FileStatus } from './entities/file.entity';
import { MinioService } from '../minio/minio.service';
import { v4 as uuidv4 } from 'uuid';
import { CollectionEntity } from '../collections/entities/collection.entity'; // Just for type

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly minioService: MinioService,
  ) {}

  async initUpload(collectionId: number, filesData: { originalName: string; size: number; mimeType: string }[]) {
    const results = [];

    for (const fileMeta of filesData) {
      const s3Key = `uploads/${uuidv4()}-${fileMeta.originalName}`;

      // 1. Create DB Record
      const newFile = this.fileRepository.create({
        collection: { id: collectionId } as CollectionEntity,
        original_name: fileMeta.originalName,
        mime_type: fileMeta.mimeType,
        size: fileMeta.size,
        s3_key: s3Key,
        status: FileStatus.UPLOADING,
      });

      const savedFile = await this.fileRepository.save(newFile);

      // 2. Init Multipart Upload in MinIO
      let uploadId = null;
      try {
        const initResponse = await this.minioService.initMultipartUpload(s3Key, fileMeta.mimeType);
        uploadId = initResponse.UploadId;
      } catch (err) {
        // Delete the record if initialization fails so we don't have phantom files
        await this.fileRepository.delete(savedFile.id);
        throw new BadRequestException('Failed to initiate upload with storage service');
      }

      // 3. Update File with UploadId
      savedFile.upload_id = uploadId;
      await this.fileRepository.save(savedFile);

      results.push({
        fileId: savedFile.id,
        uploadId: uploadId,
        key: s3Key,
      });
    }

    return results;
  }

  async getPresignedPartUrl(fileId: number, partNumber: number) {
    const file = await this.fileRepository.findOne({ where: { id: fileId } as any });
    if (!file) throw new NotFoundException('File not found');
    if (!file.upload_id) throw new BadRequestException('File is not in uploading state (missing uploadId)');

    // Generate URL
    const url = await this.minioService.getPresignedPartUrl(file.s3_key, file.upload_id, partNumber);
    return { url };
  }

  async completeUpload(fileId: number, parts: { ETag: string; PartNumber: number }[]) {
    const file = await this.fileRepository.findOne({ where: { id: fileId } as any });
    if (!file) throw new NotFoundException('File not found');

    // Complete in MinIO
    try {
      await this.minioService.completeMultipartUpload(file.s3_key, file.upload_id, parts);
    } catch (e) {
       // Log error
       throw new BadRequestException(`Failed to complete upload on storage: ${e.message}`);
    }

    // Update DB
    file.status = FileStatus.COMPLETED;
    const updatedFile = await this.fileRepository.save(file);

    // Return the complete file entity for frontend state update
    return updatedFile;
  }

  async getDownloadUrl(fileId: number) {
    const file = await this.fileRepository.findOne({ where: { id: fileId } as any });
    if (!file) throw new NotFoundException('File not found');

    const url = await this.minioService.getPresignedDownloadUrl(file.s3_key);
    return { url };
  }

  async delete(fileId: number) {
    const file = await this.fileRepository.findOne({ where: { id: fileId } as any });
    if (!file) return;

    // Delete from MinIO
    if (file.s3_key) {
        await this.minioService.delete(file.s3_key);
    }

    // Delete from DB
    await this.fileRepository.delete(fileId);
  }
}
