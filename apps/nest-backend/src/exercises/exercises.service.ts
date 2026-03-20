import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async getExercises(filters: any) {
    const { difficulty, type, topic, lessonId, search } = filters;
    return this.prisma.exercise.findMany({
      where: {
        ...(difficulty ? { difficulty: difficulty.toUpperCase() as any } : {}),
        ...(type ? { type: type.toUpperCase() as any } : {}),
        ...(topic ? { topic: { contains: topic as string, mode: 'insensitive' } } : {}),
        ...(lessonId ? { lessonId: lessonId as string } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search as string, mode: 'insensitive' } },
                { targetText: { contains: search as string, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { lesson: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExercise(id: string) {
    return this.prisma.exercise.findUnique({
      where: { id },
      include: { lesson: true },
    });
  }

  async createExercise(data: any) {
    return this.prisma.exercise.create({
      data: {
        ...data,
        difficulty: data.difficulty?.toUpperCase() as any,
        type: data.type?.toUpperCase() as any,
      },
    });
  }

  async updateExercise(id: string, data: any) {
    return this.prisma.exercise.update({
      where: { id },
      data: {
        ...data,
        difficulty: data.difficulty?.toUpperCase() as any,
        type: data.type?.toUpperCase() as any,
      },
    });
  }

  async deleteExercise(id: string) {
    return this.prisma.exercise.delete({ where: { id } });
  }

  async getMyProgress(userId: string, exerciseId: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) return null;
    return this.prisma.studentProgress.findUnique({
      where: { studentId_exerciseId: { studentId: profile.id, exerciseId } },
    });
  }
}
