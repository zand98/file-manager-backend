import { Controller, Post, Get, Delete, Param, Body, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dtos/create-collection.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Collections')
@Controller('cases/:caseId/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new collection in a case' })
  @ApiResponse({ status: 201, description: 'The collection has been successfully created.' })
  async create(
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() createCollectionDto: CreateCollectionDto,
  ) {
    return this.collectionsService.create(caseId, createCollectionDto.name);
  }

  @Get()
  @ApiOperation({ summary: 'List all collections in a case' })
  async findAll(@Param('caseId', ParseIntPipe) caseId: number) {
    return this.collectionsService.findAllByCase(caseId);
  }

  @Get(':collectionId')
  @ApiOperation({ summary: 'Get a collection by ID' })
  async findOne(@Param('collectionId', ParseIntPipe) collectionId: number) {
    const collection = await this.collectionsService.findOne(collectionId);
    if (!collection) {
        throw new NotFoundException(`Collection with ID ${collectionId} not found`);
    }
    return collection;
  }

  @Delete(':collectionId')
  @ApiOperation({ summary: 'Delete a collection' })
  async delete(@Param('collectionId', ParseIntPipe) collectionId: number) {
    return this.collectionsService.delete(collectionId);
  }
}
