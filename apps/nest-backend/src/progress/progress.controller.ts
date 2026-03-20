import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('progress')
@UseGuards(AuthGuard('jwt'))
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get('my')
  async getMyProgress(@Request() req) {
    return this.progressService.getMyProgress(req.user.userId);
  }

  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.progressService.getDashboard(req.user.userId);
  }

  @Get('teacher-dashboard')
  async getTeacherDashboard(@Request() req) {
    return this.progressService.getTeacherDashboard(req.user.userId);
  }
}
