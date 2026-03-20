import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('exercises')
@UseGuards(AuthGuard('jwt'))
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  getExercises(@Query() filters: any) {
    return this.exercisesService.getExercises(filters);
  }

  @Get(':id')
  getExercise(@Param('id') id: string) {
    return this.exercisesService.getExercise(id);
  }

  @Post()
  createExercise(@Body() body: any) {
    return this.exercisesService.createExercise(body);
  }

  @Put(':id')
  updateExercise(@Param('id') id: string, @Body() body: any) {
    return this.exercisesService.updateExercise(id, body);
  }

  @Delete(':id')
  deleteExercise(@Param('id') id: string) {
    return this.exercisesService.deleteExercise(id);
  }

  @Get(':id/progress')
  getMyProgress(@Request() req, @Param('id') id: string) {
    return this.exercisesService.getMyProgress(req.user.userId, id);
  }
}
