import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Upload storage
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({ destination: uploadDir, filename: (_, f, cb) => cb(null, `${Date.now()}-${f.originalname}`) });
const upload = multer({ storage });

// Health
app.get('/api/ai/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-microservice', port: PORT });
});

// Pronunciation Analysis
app.post('/api/ai/analyze-pronunciation', upload.single('audio'), async (req, res) => {
  const { targetText, transcript } = req.body;

  // Word matching analysis
  const tWords = (targetText || '').toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);
  const sWords = (transcript || '').toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);

  let matchCount = 0;
  const phonemeDiff = tWords.map((tw: string) => {
    const matched = sWords.some((sw: string) => sw === tw || sw.replace(/[^a-z]/g, '') === tw.replace(/[^a-z]/g, ''));
    if (matched) matchCount++;
    return { word: tw, correct: matched };
  });

  const baseScore = tWords.length ? Math.round((matchCount / tWords.length) * 100) : 85;
  const variance = Math.floor(Math.random() * 8) - 4;
  const score = Math.min(100, Math.max(0, baseScore + variance));
  const fluency = Math.min(100, score + Math.floor(Math.random() * 10) - 3);
  const wordStress = Math.min(100, score + Math.floor(Math.random() * 8) - 2);
  const intonation = Math.min(100, score + Math.floor(Math.random() * 12) - 5);
  
  // VOICE CONFIDENCE ANALYSIS
  // (In production, this would use actual audio duration and waveform parsing)
  const speed = Math.floor(100 + Math.random() * 60); // WPM (100-160 typical)
  const pauses = Math.max(0, Math.floor(sWords.length / 5) - Math.floor(Math.random() * 2));
  const confidence = Math.min(100, fluency - pauses * 2 + Math.floor(Math.random() * 5));

  let feedback = "";
  if (speed > 150) {
    feedback = "Your pronunciation is fine, but the pacing is too fast. Try slowing down slightly.";
  } else if (pauses > 3) {
    feedback = "You have too many unnatural pauses. Try to flow the words together more confidently.";
  } else if (score > 85) {
    feedback = "Excellent pronunciation and pacing! Very natural and confident.";
  } else if (score > 70) {
    feedback = "Good effort! Focus on the highlighted words to improve clarity.";
  } else {
    feedback = "Keep practicing! Try reading slowly first.";
  }

  res.json({ score, fluency, wordStress, intonation, feedback, phonemeDiff, speed, pauses, confidence });
});

// Conversation AI (mock — swap for OpenAI in production)
app.post('/api/ai/generate-conversation', async (req, res) => {
  const { userMessage, scenario, history = [] } = req.body;

  const RESPONSES: Record<string, string[]> = {
    restaurant: [
      "Great choice! Can I get you anything to drink with that?",
      "Our special today is grilled salmon. Would you like to try it?",
      "Your order is in! Is there anything else I can help you with?",
    ],
    interview: [
      "That's impressive. Can you walk me through a specific challenge you overcame?",
      "Excellent. Where do you see yourself in five years?",
      "Very good. What is your greatest professional strength?",
    ],
    travel: [
      "The departure gate is B14. The shuttle leaves every 10 minutes.",
      "Your flight is on time. Is there anything else I can help with?",
      "Please proceed to security checkpoint 3. Allow 20 minutes.",
    ],
  };

  const scenarioKey = scenario || 'restaurant';
  const idx = Math.min(history.length, 2);
  const replies = RESPONSES[scenarioKey] || RESPONSES.restaurant;
  const reply = replies[idx % replies.length];

  res.json({ reply, audioUrl: null });
});

// Text-to-speech placeholder
app.post('/api/ai/tts', async (req, res) => {
  const { text } = req.body;
  // In production: call ElevenLabs or Google TTS
  res.json({ message: 'TTS not configured. Use browser Web Speech API.', text });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Microservice running on http://localhost:${PORT}`);
});
