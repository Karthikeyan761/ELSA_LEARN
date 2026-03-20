import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// URL of the Python pronunciation microservice (Whisper + SpeechBrain)
const PRONUNCIATION_SERVICE = process.env.PRONUNCIATION_SERVICE_URL || 'http://localhost:5001';

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Upload storage ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, f, cb) => cb(null, `${Date.now()}-${f.originalname}`),
});
const upload = multer({ storage });

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/api/ai/health', async (_req, res) => {
  let pronunciationServiceStatus = 'unavailable';
  try {
    const { data } = await axios.get(`${PRONUNCIATION_SERVICE}/api/pronunciation/health`, { timeout: 2000 });
    pronunciationServiceStatus = data.status === 'ok'
      ? `ok (whisper=${data.whisper_model}, device=${data.device})`
      : 'degraded';
  } catch {
    // not running yet — that's fine
  }
  res.json({
    status: 'ok',
    service: 'ai-microservice',
    port: PORT,
    pronunciationService: pronunciationServiceStatus,
  });
});

// ── Pronunciation Analysis ─────────────────────────────────────────────────
// Tries the Python Whisper+SpeechBrain service first.
// Falls back to the local word-match scorer if the Python service is down.
app.post('/api/ai/analyze-pronunciation', upload.single('audio'), async (req, res) => {
  const { targetText, transcript: clientTranscript } = req.body;

  // ── Attempt: Python pronunciation service ──────────────────────────────
  if (req.file) {
    try {
      const form = new FormData();
      form.append('audio', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
      form.append('targetText', targetText || '');

      const { data } = await axios.post(
        `${PRONUNCIATION_SERVICE}/api/pronunciation/analyze`,
        form,
        { headers: form.getHeaders(), timeout: 60_000 },  // Whisper can take a moment
      );

      // Clean up temp file
      fs.unlink(req.file.path, () => {});

      // Normalize field names to match what the frontend expects
      return res.json({
        score:       data.score,
        fluency:     data.fluency,
        wordStress:  data.wordStress,
        intonation:  data.intonation,
        confidence:  data.confidence,
        feedback:    data.feedback,
        phonemeDiff: data.phonemeDiff,
        speed:       data.speakingRate,
        transcript:  data.transcript,
        engine:      data.engine,
        source:      'whisper+speechbrain',
      });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'unknown';
      console.warn(`⚠️  Python pronunciation service unavailable (${msg}). Falling back to word-match.`);
      // Clean up and fall through to word-match
      if (req.file?.path) fs.unlink(req.file.path, () => {});
    }
  }

  // ── Attempt: RapidAPI (High Quality Fallback) ──────────────────────────
  if (req.file && process.env.RAPIDAPI_KEY) {
    try {
      console.log('🎙️  RapidAPI Pronunciation Analysis...');
      const form = new FormData();
      form.append('audio', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
      form.append('targetText', targetText || '');

      const rapidRes = await axios.post(
        `https://${process.env.RAPIDAPI_HOST}/pronunciation`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
          },
          timeout: 45_000,
        }
      );

      // Clean up temp file
      fs.unlink(req.file.path, () => {});

      const data = rapidRes.data;
      return res.json({
        score: data.score || data.overall_score || 80,
        fluency: data.fluency || 80,
        accuracy: data.accuracy || 80,
        intonation: data.intonation || 80,
        wordStress: data.word_stress || 80,
        speed: data.speaking_rate || 140,
        pauses: data.pauses || 0,
        confidence: data.confidence || 85,
        feedback: data.feedback || 'Great pronunciation!',
        phonemeDiff: data.phoneme_diff || data.details || [],
        transcript: data.transcript || '',
        source: 'rapidapi-service',
      });
    } catch (err: any) {
      console.warn(`⚠️  RapidAPI service error: ${err.message}. Falling back to word-match.`);
    }
  }

  // ── Fallback: local word-match scorer ──────────────────────────────────
  const tWords = (targetText || '').toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);
  const sWords = (clientTranscript || '').toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);

  let matchCount = 0;
  const phonemeDiff = tWords.map((tw: string) => {
    const matched = sWords.some(
      (sw: string) => sw === tw || sw.replace(/[^a-z]/g, '') === tw.replace(/[^a-z]/g, ''),
    );
    if (matched) matchCount++;
    return { word: tw, correct: matched, similarity: matched ? 1.0 : 0.0 };
  });

  const baseScore  = tWords.length ? Math.round((matchCount / tWords.length) * 100) : 85;
  const score      = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 8) - 4));
  const fluency    = Math.min(100, score + Math.floor(Math.random() * 10) - 3);
  const wordStress = Math.min(100, score + Math.floor(Math.random() * 8) - 2);
  const intonation = Math.min(100, score + Math.floor(Math.random() * 12) - 5);
  const speed      = Math.floor(100 + Math.random() * 60);
  const pauses     = Math.max(0, Math.floor(sWords.length / 5) - Math.floor(Math.random() * 2));
  const confidence = Math.min(100, fluency - pauses * 2 + Math.floor(Math.random() * 5));

  let feedback = '';
  if (speed > 150)     feedback = 'Your pronunciation is fine, but the pacing is too fast. Try slowing down.';
  else if (pauses > 3) feedback = 'You have too many unnatural pauses. Try to flow the words together.';
  else if (score > 85) feedback = 'Excellent pronunciation and pacing! Very natural and confident.';
  else if (score > 70) feedback = 'Good effort! Focus on the highlighted words to improve clarity.';
  else                 feedback = 'Keep practicing! Try reading slowly first.';

  res.json({
    score, fluency, wordStress, intonation, feedback, phonemeDiff,
    speed, pauses, confidence,
    source: 'word-match-fallback',
  });
});

// ── Transcribe-only (proxy to Python Whisper service) ─────────────────────
app.post('/api/ai/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

  try {
    const form = new FormData();
    form.append('audio', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const { data } = await axios.post(
      `${PRONUNCIATION_SERVICE}/api/pronunciation/transcribe-only`,
      form,
      { headers: form.getHeaders(), timeout: 45_000 },
    );

    fs.unlink(req.file.path, () => {});
    return res.json(data);
  } catch (err: any) {
    fs.unlink(req.file.path, () => {});
    return res.status(503).json({ error: 'Transcription service unavailable', detail: err.message });
  }
});

// ── Conversation AI ────────────────────────────────────────────────────────
app.post('/api/ai/generate-conversation', async (req, res) => {
  const { scenario, history = [] } = req.body;

  const RESPONSES: Record<string, string[]> = {
    restaurant: [
      'Great choice! Can I get you anything to drink with that?',
      'Our special today is grilled salmon. Would you like to try it?',
      'Your order is in! Is there anything else I can help you with?',
    ],
    interview: [
      "That's impressive. Can you walk me through a specific challenge you overcame?",
      'Excellent. Where do you see yourself in five years?',
      'Very good. What is your greatest professional strength?',
    ],
    travel: [
      'The departure gate is B14. The shuttle leaves every 10 minutes.',
      'Your flight is on time. Is there anything else I can help with?',
      'Please proceed to security checkpoint 3. Allow 20 minutes.',
    ],
  };

  const scenarioKey = scenario || 'restaurant';
  const replies = RESPONSES[scenarioKey] || RESPONSES.restaurant;
  const reply = replies[Math.min(history.length, 2) % replies.length];

  res.json({ reply, audioUrl: null });
});

// ── Text-to-speech placeholder ─────────────────────────────────────────────
app.post('/api/ai/tts', async (req, res) => {
  const { text } = req.body;
  res.json({ message: 'TTS not configured. Use browser Web Speech API.', text });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Microservice running on http://localhost:${PORT}`);
  console.log(`🔗 Pronunciation service: ${PRONUNCIATION_SERVICE}`);
});
