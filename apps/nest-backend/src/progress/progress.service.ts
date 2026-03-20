import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getMyProgress(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        progress: {
          include: { exercise: { select: { title: true, difficulty: true, topic: true, type: true } } },
          orderBy: { lastAttemptAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!profile) throw new NotFoundException('Student profile not found');
    return profile;
  }

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            class: {
              include: {
                lessons: {
                  include: {
                    exercises: { select: { id: true, title: true, type: true, difficulty: true, topic: true } }
                  }
                }
              }
            },
            progress: {
              include: { exercise: { select: { title: true, type: true, difficulty: true, topic: true } } },
              orderBy: { lastAttemptAt: 'desc' },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const recentRecordings = await this.prisma.recording.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      take: 7,
      select: { score: true, fluency: true, intonation: true, createdAt: true },
    });

    const { password, ...userData } = user;
    return { user: userData, recentRecordings };
  }

  async getTeacherDashboard(userId: string) {
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      include: {
        classes: {
          include: {
            students: true,
            lessons: { include: { exercises: { select: { id: true } } } },
          },
        },
      },
    });
    if (!teacherProfile) throw new NotFoundException('Teacher profile not found');

    let totalStudents = 0;
    let totalPracticeMin = 0;
    let totalScoreSum = 0;
    let scoreCount = 0;

    for (const cls of teacherProfile.classes) {
      totalStudents += cls.students.length;
      for (const s of cls.students) {
        totalPracticeMin += s.practiceMin;
        if (s.score > 0) { totalScoreSum += s.score; scoreCount++; }
      }
    }

    return {
      totalClasses: teacherProfile.classes.length,
      totalStudents,
      avgScore: scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0,
      totalPracticeMin,
      classes: teacherProfile.classes.map((c) => ({
        id: c.id,
        name: c.name,
        studentCount: c.students.length,
        avgScore: c.students.length
          ? Math.round(c.students.reduce((a, s) => a + s.score, 0) / c.students.length)
          : 0,
        lessonCount: c.lessons.length,
      })),
    };
  }
}
