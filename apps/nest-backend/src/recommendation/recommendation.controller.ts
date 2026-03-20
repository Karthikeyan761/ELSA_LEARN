import { Controller, Post, Body, Get } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'recommendation' };
  }

  @Post('next')
  recommendNext(@Body() body: any) {
    const { currentScore, weakPhonemes } = body;
    return this.recommendationService.recommendNext(currentScore, weakPhonemes);
  }
}
