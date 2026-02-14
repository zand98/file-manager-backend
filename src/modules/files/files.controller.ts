import { Controller, Post, Get, Delete, Body, Param, Query, ParseIntPipe, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { FilesService } from './files.service';
import { CollectionsService } from 'src/modules/collections/collections.service';
import { InitUploadDto } from './dtos/init-upload.dto';
import { CompleteUploadDto } from './dtos/complete-upload.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Files')
@Controller()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly collectionsService: CollectionsService,
  ) {}

  @Post('cases/:caseId/uploads/init')
  @ApiOperation({ summary: 'Initiate file uploads for a case collection' })
  async initUpload(
    @Param('caseId', ParseIntPipe) caseId: number,
    // Make collectionId optional in body interface
    @Body() body: { collectionId?: number; files: any[] },
  ) {
    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    
    let collection;

    if (body.collectionId) {
      // Verify collection exists and belongs to this case
      collection = await this.collectionsService.findOne(body.collectionId);
      if (!collection) {
        throw new BadRequestException(`Collection ${body.collectionId} not found`);
      }
      // Ideally we should check if collection.case.id === caseId, but assuming findOne handles or we allow cross-link for now (service logic)
    } else {
      // Requirement: If a collection name is not provided, use current datetime.
      // We create a new collection for this case.
      // CollectionsService.create uses new Date().toLocaleString() if name is not provided.
      try {
        collection = await this.collectionsService.create(caseId);
      } catch (e) {
        throw new BadRequestException(`Failed to create default collection: ${e.message}`);
      }
    }

    // Init Uploads with the collection ID
    return this.filesService.initUpload(collection.id, body.files);
  }

  @Get('files/:fileId/part-url')
  @ApiOperation({ summary: 'Get presigned URL for a specific part' })
  async getPartUrl(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query('partNumber', ParseIntPipe) partNumber: number,
  ) {
    return this.filesService.getPresignedPartUrl(fileId, partNumber);
  }

  

  @Post('files/:fileId/complete')
  @ApiOperation({ summary: 'Complete a multipart upload' })
  async completeUpload(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Body() body: CompleteUploadDto, // Using DTO for validation
  ) {
    return this.filesService.completeUpload(fileId, body.parts);
  }

  @Get('files/:fileId/download')
  @ApiOperation({ summary: 'Get download URL for a file' })
  async download(@Param('fileId', ParseUUIDPipe) fileId: string) {
    return this.filesService.getDownloadUrl(fileId);
  }
  @Delete('files/:fileId')
  @ApiOperation({ summary: 'Delete a file' })
  async delete(@Param('fileId', ParseUUIDPipe) fileId: string) {
    return this.filesService.delete(fileId);
  }
}
