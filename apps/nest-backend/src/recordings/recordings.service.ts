import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class RecordingsService {
  constructor(private prisma: PrismaService) {}

  async uploadRecording(userId: string, file: Express.Multer.File, body: any) {
    const { exerciseId, score, fluency, wordStress, intonation, feedback, transcript, phonemeDiff, speed, pauses, confidence } = body;

    const audioUrl = `/uploads/${file.filename}`;
    const newScore = parseFloat(score) || 0;

    const recording = await this.prisma.recording.create({
      data: {
        audioUrl,
        transcript: transcript || '',
        score: newScore,
        fluency: parseFloat(fluency) || 0,
        wordStress: parseFloat(wordStress) || 0,
        intonation: parseFloat(intonation) || 0,
        speed: speed ? parseFloat(speed) : null,
        pauses: pauses ? parseInt(pauses) : null,
        confidence: confidence ? parseFloat(confidence) : null,
        feedback: feedback || '',
        phonemeDiff: phonemeDiff ? (typeof phonemeDiff === 'string' ? JSON.parse(phonemeDiff) : phonemeDiff) : null,
        studentId: userId,
        exerciseId,
      },
    });

    if (exerciseId) {
      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { userId },
      });

      if (studentProfile) {
        const existingProgress = await this.prisma.studentProgress.findUnique({
          where: { studentId_exerciseId: { studentId: studentProfile.id, exerciseId } },
        });

        if (existingProgress) {
          await this.prisma.studentProgress.update({
            where: { id: existingProgress.id },
            data: {
              attempts: existingProgress.attempts + 1,
              bestScore: Math.max(existingProgress.bestScore, newScore),
              completed: newScore >= 70,
              lastAttemptAt: new Date(),
            },
          });
        } else {
          await this.prisma.studentProgress.create({
            data: {
              studentId: studentProfile.id,
              exerciseId,
              attempts: 1,
              bestScore: newScore,
              completed: newScore >= 70,
              lastAttemptAt: new Date(),
            },
          });
        }

        const allScores = await this.prisma.recording.findMany({
          where: { studentId: userId },
          select: { score: true },
        });
        const avgScore = allScores.length ? allScores.reduce((a, r) => a + r.score, 0) / allScores.length : 0;
        const completedCount = await this.prisma.studentProgress.count({
          where: { studentId: studentProfile.id, completed: true },
        });

        let earnedXp = 5;
        try {
          const ex = await this.prisma.exercise.findUnique({ where: { id: exerciseId } });
          const gamificationRes = await axios.post('http://localhost:4002/api/gamification/calculate-xp', {
            score: newScore,
            difficulty: ex?.difficulty,
            type: ex?.type,
          });
          earnedXp = gamificationRes.data.earnedXp || 10;
        } catch (err) {
          console.warn('Gamification service unavailable.');
        }

        await this.prisma.studentProfile.update({
          where: { userId },
          data: {
            score: avgScore,
            lessonsDone: completedCount,
            practiceMin: { increment: 2 },
            xp: { increment: earnedXp },
            streak: { increment: studentProfile.lastPracticeDate?.toDateString() === new Date().toDateString() ? 0 : 1 },
            lastPracticeDate: new Date(),
          },
        });

        if (recording.phonemeDiff) {
          try {
            const rawWords = Array.isArray(recording.phonemeDiff) ? recording.phonemeDiff : [];
            const words = rawWords as any[];
            for (const w of words) {
              if (w && !w.correct && w.word) {
                const phonemeStr = String(w.word).substring(0, 2);
                await this.prisma.phonemeMistake.upsert({
                  where: { studentId_phoneme: { studentId: studentProfile.id, phoneme: phonemeStr } },
                  update: { count: { increment: 1 }, lastSeen: new Date() },
                  create: { studentId: studentProfile.id, phoneme: phonemeStr },
                });
              }
            }
          } catch (err) {}
        }
      }
    }

    return { recording };
  }

  async getMyRecordings(userId: string) {
    return this.prisma.recording.findMany({
      where: { studentId: userId },
      include: { exercise: { select: { title: true, difficulty: true, topic: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getMyStats(userId: string) {
    return this.prisma.recording.findMany({
      where: { studentId: userId },
      select: { score: true, fluency: true, intonation: true, wordStress: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });
  }
}
