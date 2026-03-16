import { Router } from 'express';
import prisma from '../context/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/classes - Get teacher's classes
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role === 'TEACHER') {
      const profile = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } });
      if (!profile) return res.json([]);
      const classes = await prisma.class.findMany({
        where: { teacherId: profile.id },
        include: {
          students: { include: { user: { select: { id: true, name: true, email: true } } } },
          lessons: { select: { id: true, title: true, difficulty: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(classes);
    }
    // Student sees their class
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { class: { include: { lessons: true } } },
    });
    res.json(profile?.class ? [profile.class] : []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST /api/classes - Create class (Teacher only)
router.post('/', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { name, description } = req.body;
  try {
    const profile = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Teacher profile not found' });
    const newClass = await prisma.class.create({
      data: { name, description, teacherId: profile.id },
    });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// GET /api/classes/:id - Single class with details
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        students: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        lessons: { include: { exercises: { select: { id: true, title: true, difficulty: true, type: true } } } },
        teacher: { include: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// POST /api/classes/:id/enroll - Enroll student in class
router.post('/:id/enroll', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Student profile not found' });
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { classId: req.params.id },
    });
    res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

// POST /api/classes/:id/unenroll - Student leaves class
router.post('/:id/unenroll', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Student profile not found' });
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { classId: null },
    });
    res.json({ message: 'Left class successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave class' });
  }
});

// POST /api/classes/:id/add-student - Teacher adds student by email
router.post('/:id/add-student', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true }
    });
    
    if (!user || !user.studentProfile) {
      return res.status(404).json({ error: 'Student with this email not found' });
    }

    await prisma.studentProfile.update({
      where: { id: user.studentProfile.id },
      data: { classId: req.params.id }
    });

    res.json({ message: 'Student added successfully', student: user.studentProfile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// DELETE /api/classes/:id/students/:studentId - Teacher removes student
router.delete('/:id/students/:studentId', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const student = await prisma.studentProfile.findUnique({ where: { id: req.params.studentId } });
    if (!student || student.classId !== req.params.id) {
      return res.status(404).json({ error: 'Student not found in this class' });
    }

    await prisma.studentProfile.update({
      where: { id: req.params.studentId },
      data: { classId: null }
    });

    res.json({ message: 'Student removed from class' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove student' });
  }
});

// POST /api/classes/:id/lessons - Assign existing lesson to class
router.post('/:id/lessons', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { lessonId } = req.body;
  try {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { classId: req.params.id }
    });
    res.json({ message: 'Lesson assigned to class' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign lesson' });
  }
});

// GET /api/classes/:id/analytics - Class analytics for teacher
router.get('/:id/analytics', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        students: {
          include: {
            user: { select: { name: true, email: true } },
            progress: { include: { exercise: { select: { title: true } } } },
          },
        },
      },
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const studentData = cls.students.map((s) => ({
      id: s.user.email,
      name: s.user.name,
      score: s.score,
      lessonsDone: s.lessonsDone,
      practiceMin: s.practiceMin,
      streak: s.streak,
      completedExercisesCount: s.progress.filter((p) => p.completed).length,
      completedExercises: s.progress.filter((p) => p.completed).map(p => p.exercise.title),
      realProfileId: s.id
    }));

    res.json({ students: studentData, totalStudents: cls.students.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
