import { Controller, Post, Get, Delete, Param, Body, Query, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dtos/create-collection.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaginationPayload } from '../app/pagination.payload';
import { PaginationResult } from '../app/paginationResult.interface';
import { VALID_COLLECTION_FIELDS, ORDER_BY } from '../../shared/constants';

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
  @ApiResponse({ status: 200, description: 'Collections retrieved successfully' })
  @ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by collection name',
  })
  @ApiQuery({
      name: 'sortBy',
      required: false,
      enum: VALID_COLLECTION_FIELDS,
  })
  @ApiQuery({
      name: 'orderBy',
      required: false,
      enum: ORDER_BY,
  })
  async findAll(
    @Param('caseId', ParseIntPipe) caseId: number,
    @Query() paginationPayload: PaginationPayload,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('orderBy') orderBy?: 'ASC' | 'DESC',
  ): Promise<PaginationResult> {
    return this.collectionsService.findAllByCase(
        caseId,
        paginationPayload,
        search,
        sortBy,
        orderBy
    );
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
