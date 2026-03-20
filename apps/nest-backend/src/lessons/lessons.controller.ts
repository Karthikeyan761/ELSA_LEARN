import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('lessons')
@UseGuards(AuthGuard('jwt'))
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.lessonsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.lessonsService.create(body);
  }
}
