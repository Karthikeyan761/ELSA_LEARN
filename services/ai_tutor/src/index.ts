import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Fix: Correct path to .env file (one level deeper)
dotenv.config({ path: path.join(__dirname, '../../../apps/backend/.env') });

const app = express();
// Fix: Use 4004 for the AI Tutor service to avoid conflict with the main backend (port 4000)
const PORT = 4004;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/tutor/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-tutor', port: PORT });
});

app.post('/api/tutor/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  
  // Real AI or Mock Fallback
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return res.json({ reply: `(Tutor Mock Mode) You said: "${message}". Please configure GEMINI_API_KEY in apps/backend/.env to unlock the real AI Tutor.` });
  }

  try {
    const systemPrompt = "You are an expert English language tutor. Explain grammar rules, offer pronunciation tips, and encourage the student. Be concise and friendly.";
    
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Fix: Correct Gemini model name (gemini-2.5-flash doesn't exist)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood! I'm ready to help the student." }] },
          ...history.map((h: any) => ({
            role: h.role === 'USER' ? 'user' : 'model',
            parts: [{ text: h.content }]
          }))
        ]
      });

      const result = await chat.sendMessage(message);
      return res.json({ reply: result.response.text() });
    }
    
    res.json({ reply: 'AI configured but failed to generate response.' });
  } catch (err: any) {
    res.json({ reply: `AI Error: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 AI Tutor Microservice running on http://localhost:${PORT}`);
});
