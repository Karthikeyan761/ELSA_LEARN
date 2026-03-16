import { Router } from 'express';
import prisma from '../context/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/progress/my - Student's overall progress
router.get('/my', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.userId },
      include: {
        progress: {
          include: { exercise: { select: { title: true, difficulty: true, topic: true, type: true } } },
          orderBy: { lastAttemptAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!profile) return res.status(404).json({ error: 'Student profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /api/progress/dashboard - Full student dashboard data
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        studentProfile: {
          include: {
            class: {
              include: {
                lessons: {
                  include: {
                    exercises: { select: { id: true, title: true, type: true, difficulty: true } }
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
    if (!user) return res.status(404).json({ error: 'User not found' });

    const recentRecordings = await prisma.recording.findMany({
      where: { studentId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 7,
      select: { score: true, fluency: true, intonation: true, createdAt: true },
    });

    res.json({ user: { ...user, password: undefined }, recentRecordings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/progress/teacher-dashboard - Teacher dashboard stats
router.get('/teacher-dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: req.user!.userId },
      include: {
        classes: {
          include: {
            students: true,
            lessons: { include: { exercises: { select: { id: true } } } },
          },
        },
      },
    });
    if (!teacherProfile) return res.status(404).json({ error: 'Teacher profile not found' });

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

    res.json({
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
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teacher dashboard' });
  }
});

export default router;
