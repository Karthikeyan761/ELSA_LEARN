import { Controller, Post, Body } from '@nestjs/common';
import { GamificationService } from './gamification.service';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('calculate-xp')
  async calculateXp(@Body() body: any) {
    const { score, difficulty, type } = body;
    return this.gamificationService.calculateXp(score, difficulty, type);
  }

  @Post('evaluate-badges')
  async evaluateBadges(@Body() body: any) {
    const { totalXp, lessonsDone, perfectScores, streak } = body;
    return this.gamificationService.evaluateBadges(totalXp, lessonsDone, perfectScores, streak);
  }
}
