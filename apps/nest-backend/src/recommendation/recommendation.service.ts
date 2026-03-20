import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationService {
  recommendNext(currentScore: number, weakPhonemes: string[] = []): { recommendedDifficulty: string, targetTopic: string } {
    const targetTopic = weakPhonemes && weakPhonemes.length > 0 ? 'pronunciation' : 'general';
    let recommendedDifficulty = 'BEGINNER';
    if (currentScore > 75) recommendedDifficulty = 'INTERMEDIATE';
    if (currentScore > 90) recommendedDifficulty = 'ADVANCED';

    return { recommendedDifficulty, targetTopic };
  }
}
