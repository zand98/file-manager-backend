import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dtos/create-case.dto';
import { PaginationResult } from '../app/paginationResult.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaginationPayload } from '../app/pagination.payload';
import { VALID_CASE_FIELDS, ORDER_BY } from '../../shared/constants';

@ApiTags('Cases')
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new case' })
  @ApiResponse({ status: 201, description: 'The case has been successfully created.' })
  create(@Body() createCaseDto: CreateCaseDto) {
    return this.casesService.create(createCaseDto.name);
  }

  @Get()
  @ApiOperation({ summary: 'List all cases' })
  @ApiResponse({ status: 200, description: 'Cases retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to fetch cases' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by case name',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: VALID_CASE_FIELDS,
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ORDER_BY,
  })
  findAll(
    @Query() paginationPayload: PaginationPayload,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('orderBy') orderBy?: 'ASC' | 'DESC',
  ): Promise<PaginationResult> {
    return this.casesService.findAll(
      paginationPayload,
      search,
      sortBy,
      orderBy,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a case by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.casesService.findOne(id);
  }
}
