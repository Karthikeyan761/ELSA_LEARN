import { Injectable } from '@nestjs/common';

@Injectable()
export class GamificationService {
  calculateXp(score: number, difficulty: string, type: string): { earnedXp: number } {
    let base = 10;
    if (difficulty === 'INTERMEDIATE') base += 5;
    if (difficulty === 'ADVANCED') base += 10;
    if (type === 'ROLEPLAY' || type === 'CONVERSATION') base += 10;

    // Multiply by score percentage
    const earnedXp = Math.max(5, Math.floor(base * ((score || 0) / 100)));
    return { earnedXp };
  }

  evaluateBadges(totalXp: number, lessonsDone: number, perfectScores: number, streak: number): { unlockedBadges: string[] } {
    const unlocked: string[] = [];

    if (lessonsDone >= 1) unlocked.push('First Step');
    if (lessonsDone >= 10) unlocked.push('Dedicated Learner');
    if (streak >= 3) unlocked.push('3-Day Streak');
    if (streak >= 7) unlocked.push('7-Day Streak');
    if (totalXp >= 1000) unlocked.push('XP Novice');
    if (totalXp >= 5000) unlocked.push('XP Master');
    if (perfectScores >= 5) unlocked.push('Perfectionist');

    return { unlockedBadges: unlocked };
  }
}
