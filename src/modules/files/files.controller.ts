import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe, 
  ParseUUIDPipe, 
  BadRequestException, 
  UseGuards 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FilesService } from './files.service';
import { CollectionsService } from '../collections/collections.service';
import { CompleteUploadDto } from './dtos/complete-upload.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Files')
@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly collectionsService: CollectionsService,
  ) {}

  @Post('cases/:caseId/uploads/init')
  @Roles('admin') 
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
    } else {
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
  @Roles('admin') // Download/Upload privilege restricted to admin
  @ApiOperation({ summary: 'Get presigned URL for a specific part' })
  async getPartUrl(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query('partNumber', ParseIntPipe) partNumber: number,
  ) {
    return this.filesService.getPresignedPartUrl(fileId, partNumber);
  }

  @Post('files/:fileId/complete')
  @Roles('admin') // Download/Upload privilege restricted to admin
  @ApiOperation({ summary: 'Complete a multipart upload' })
  async completeUpload(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Body() body: CompleteUploadDto, // Using DTO for validation
  ) {
    return this.filesService.completeUpload(fileId, body.parts);
  }

  @Get('files/:fileId/download')
  @Roles('admin') // Download privilege restricted to admin
  @ApiOperation({ summary: 'Get download URL for a file' })
  async download(@Param('fileId', ParseUUIDPipe) fileId: string) {
    return this.filesService.getDownloadUrl(fileId);
  }

  @Get('files')
  @Roles('admin', 'user') // User can read/list
  @ApiOperation({ summary: 'List all files' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  findAll() {
    return this.filesService.findAll();
  }

  @Get('files/:id')
  @Roles('admin', 'user') // User can read/view details
  @ApiOperation({ summary: 'Get a file by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.findOne(id);
  }

  @Delete('files/:fileId')
  @Roles('admin') // Delete restricted to admin
  @ApiOperation({ summary: 'Delete a file' })
  async delete(@Param('fileId', ParseUUIDPipe) fileId: string) {
    return this.filesService.delete(fileId);
  }
}
