import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('classes')
@UseGuards(AuthGuard('jwt'))
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  async findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.classesService.create(req.user.userId, body);
  }

  @Post(':id/enroll')
  async enroll(@Param('id') id: string, @Request() req) {
    return this.classesService.enroll(id, req.user.userId);
  }

  @Post(':id/unenroll')
  async unenroll(@Param('id') id: string, @Request() req) {
    return this.classesService.unenroll(id, req.user.userId);
  }

  @Post(':id/add-student')
  async addStudent(@Param('id') id: string, @Body('email') email: string) {
    return this.classesService.addStudent(id, email);
  }

  @Delete(':id/students/:studentId')
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.classesService.removeStudent(id, studentId);
  }

  @Get(':id/analytics')
  async getAnalytics(@Param('id') id: string) {
    return this.classesService.getAnalytics(id);
  }
}
