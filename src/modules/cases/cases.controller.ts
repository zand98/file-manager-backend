import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dtos/create-case.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
  findAll() {
    return this.casesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a case by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.casesService.findOne(id);
  }
}
