import { Router } from 'express';
import prisma from '../context/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// POST /api/recordings/upload - Upload audio and get score
router.post('/upload', authenticate, upload.single('audio'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
  const { exerciseId, score, fluency, wordStress, intonation, feedback, transcript, phonemeDiff, speed, pauses, confidence } = req.body;

  try {
    const audioUrl = `/uploads/${req.file.filename}`;
    const newScore = parseFloat(score) || 0;
    const recording = await prisma.recording.create({
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
        phonemeDiff: phonemeDiff ? JSON.parse(phonemeDiff) : null,
        studentId: req.user!.userId,
        exerciseId,
      },
    });

    // Update Student Progress & Gamification
    if (exerciseId) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.userId },
      });

      if (studentProfile) {
        const existingProgress = await prisma.studentProgress.findUnique({
          where: { studentId_exerciseId: { studentId: studentProfile.id, exerciseId } },
        });

        // Track Progress
        if (existingProgress) {
          await prisma.studentProgress.update({
            where: { id: existingProgress.id },
            data: {
              attempts: existingProgress.attempts + 1,
              bestScore: Math.max(existingProgress.bestScore, newScore),
              completed: newScore >= 70,
              lastAttemptAt: new Date(),
            },
          });
        } else {
          await prisma.studentProgress.create({
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

        const allScores = await prisma.recording.findMany({
          where: { studentId: req.user!.userId },
          select: { score: true },
        });
        const avgScore = allScores.length ? allScores.reduce((a, r) => a + r.score, 0) / allScores.length : 0;
        const completedCount = await prisma.studentProgress.count({
          where: { studentId: studentProfile.id, completed: true },
        });

        // Generate Gamification XP by calling Microservice
        let earnedXp = 5;
        try {
          // Find exercise difficulty
          const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
          const gamificationRes = await fetch('http://localhost:4002/api/gamification/calculate-xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: newScore, difficulty: ex?.difficulty, type: ex?.type })
          });
          if (gamificationRes.ok) {
            const data: any = await gamificationRes.json();
            earnedXp = data.earnedXp || 10;
          }
        } catch (err) {
          console.warn('Gamification service unavailable. Falling back to default XP.');
        }

        // Apply XP and Update Profile
        await prisma.studentProfile.update({
          where: { userId: req.user!.userId },
          data: {
            score: avgScore,
            lessonsDone: completedCount,
            practiceMin: { increment: 2 },
            xp: { increment: earnedXp }, // New Gamification XP tracking
            streak: { increment: studentProfile.lastPracticeDate?.toDateString() === new Date().toDateString() ? 0 : 1 },
            lastPracticeDate: new Date()
          },
        });
        
        // Adaptive Learning Engine Hooks (Save Mistaken Phonemes)
        if (recording.phonemeDiff) {
            try {
                const words = Array.isArray(recording.phonemeDiff) ? recording.phonemeDiff : [];
                for (const w of words) {
                    if (!(w as any).correct) {
                        const phonemeStr = (w as any).word.substring(0, 2); // basic naive implementation for tracking
                        await prisma.phonemeMistake.upsert({
                            where: { studentId_phoneme: { studentId: studentProfile.id, phoneme: phonemeStr } },
                            update: { count: { increment: 1 }, lastSeen: new Date() },
                            create: { studentId: studentProfile.id, phoneme: phonemeStr }
                        });
                    }
                }
            } catch (err) { }
        }
      }
    }

    res.json({ recording });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save recording' });
  }
});

// GET /api/recordings/my - Get student's recordings
router.get('/my', authenticate, async (req: AuthRequest, res) => {
  try {
    const recordings = await prisma.recording.findMany({
      where: { studentId: req.user!.userId },
      include: { exercise: { select: { title: true, difficulty: true, topic: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(recordings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// GET /api/recordings/stats - Student score trends
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const recordings = await prisma.recording.findMany({
      where: { studentId: req.user!.userId },
      select: { score: true, fluency: true, intonation: true, wordStress: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });
    res.json(recordings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
