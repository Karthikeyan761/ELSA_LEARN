import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { students: true, lessons: true } },
      },
    });
  }

  async findOne(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        students: { include: { user: { select: { id: true, name: true, email: true } } } },
        lessons: { include: { exercises: { select: { id: true, title: true, difficulty: true, type: true } } } },
        teacher: { include: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async create(userId: string, data: any) {
    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!teacher) throw new UnauthorizedException('Teacher profile required');

    return this.prisma.class.create({
      data: {
        name: data.name,
        description: data.description,
        teacherId: teacher.id,
      },
    });
  }

  async enroll(classId: string, userId: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) throw new UnauthorizedException('Student profile required');

    return this.prisma.studentProfile.update({
      where: { id: student.id },
      data: { classId },
    });
  }

  async unenroll(classId: string, userId: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) throw new UnauthorizedException('Student profile required');

    return this.prisma.studentProfile.update({
      where: { id: student.id },
      data: { classId: null },
    });
  }

  async addStudent(classId: string, studentEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { email: studentEmail }, include: { studentProfile: true } });
    if (!user || !user.studentProfile) throw new NotFoundException('Student not found');

    return this.prisma.studentProfile.update({
      where: { id: user.studentProfile.id },
      data: { classId },
    });
  }

  async removeStudent(classId: string, studentId: string) {
    // studentId here is the userId from the user profile, but let's check what the frontend sends.
    // In teacher-dashboard, it usually sends the profile ID or userId.
    // Looking at getAnalytics, it returns 'id: s.user.id' and 'realProfileId: s.id'.
    // Usually, studentId in these contexts refers to the userId.
    
    const student = await this.prisma.studentProfile.findFirst({
      where: { 
        OR: [
          { id: studentId },
          { userId: studentId }
        ]
      }
    });

    if (!student) throw new NotFoundException('Student profile not found');

    return this.prisma.studentProfile.update({
      where: { id: student.id },
      data: { classId: null },
    });
  }

  async getAnalytics(classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            progress: { 
              where: { completed: true },
              include: { exercise: { select: { title: true } } }
            },
          },
        },
      },
    });

    if (!cls) throw new NotFoundException('Class not found');

    const students = cls.students.map(s => ({
      id: s.user.id,
      realProfileId: s.id,
      name: s.user.name,
      email: s.user.email,
      score: s.score,
      lessonsDone: s.lessonsDone,
      practiceMin: s.practiceMin,
      streak: s.streak,
      completedExercises: s.progress.map(p => p.exercise.title),
    }));

    return {
      totalStudents: students.length,
      students,
    };
  }
}
