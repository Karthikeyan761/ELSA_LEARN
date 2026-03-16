import { Router } from 'express';
import prisma from '../context/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/exercises - List exercises (with filters)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { difficulty, type, topic, lessonId, search } = req.query;
  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        ...(difficulty ? { difficulty: difficulty as any } : {}),
        ...(type ? { type: type as any } : {}),
        ...(topic ? { topic: { contains: topic as string } } : {}),
        ...(lessonId ? { lessonId: lessonId as string } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search as string } },
                { targetText: { contains: search as string } },
              ],
            }
          : {}),
      },
      include: { lesson: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// GET /api/exercises/:id - Single exercise
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.id },
      include: { lesson: true },
    });
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// POST /api/exercises - Create exercise (Teacher only)
router.post('/', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { title, targetText, instructions, difficulty, type, topic, phonemeStructure, lessonId } = req.body;
  try {
    const exercise = await prisma.exercise.create({
      data: { title, targetText, instructions, difficulty: difficulty as any, type: type as any, topic, phonemeStructure, lessonId },
    });
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// PUT /api/exercises/:id - Update exercise (Teacher)
router.put('/:id', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { title, targetText, instructions, difficulty, type, topic, phonemeStructure, lessonId } = req.body;
  try {
    const exercise = await prisma.exercise.update({
      where: { id: req.params.id },
      data: { title, targetText, instructions, difficulty: difficulty as any, type: type as any, topic, phonemeStructure, lessonId },
    });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update exercise' });
  }
});

// DELETE /api/exercises/:id - Delete exercise (Teacher)
router.delete('/:id', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    await prisma.exercise.delete({ where: { id: req.params.id } });
    res.json({ message: 'Exercise deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

// GET /api/exercises/:id/progress - Get student's progress on this exercise
router.get('/:id/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.json(null);
    const progress = await prisma.studentProgress.findUnique({
      where: { studentId_exerciseId: { studentId: profile.id, exerciseId: req.params.id } },
    });
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;
