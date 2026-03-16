import { Router } from 'express';
import prisma from '../context/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/lessons - List lessons
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { classId, difficulty, topic } = req.query;
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        ...(classId ? { classId: classId as string } : {}),
        ...(difficulty ? { difficulty: difficulty as any } : {}),
        ...(topic ? { topic: { contains: topic as string } } : {}),
      },
      include: { exercises: { select: { id: true, title: true, type: true, difficulty: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// GET /api/lessons/:id - Single lesson
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { exercises: true, class: { select: { name: true } } },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// POST /api/lessons - Create lesson (Teacher)
router.post('/', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { title, description, difficulty, topic, classId } = req.body;
  try {
    const lesson = await prisma.lesson.create({
      data: { title, description, difficulty: difficulty as any, topic, classId },
    });
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// PUT /api/lessons/:id - Update lesson
router.put('/:id', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { title, description, difficulty, topic, classId } = req.body;
  try {
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { title, description, difficulty: difficulty as any, topic, classId },
    });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

export default router;
