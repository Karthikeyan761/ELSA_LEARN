import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { classId, difficulty, topic } = query;
    return this.prisma.lesson.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(topic ? { topic: { contains: topic } } : {}),
      },
      include: { exercises: { select: { id: true, title: true, type: true, difficulty: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { exercises: true, class: { select: { name: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async create(data: any) {
    return this.prisma.lesson.create({
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        topic: data.topic,
        classId: data.classId,
      },
    });
  }
}
