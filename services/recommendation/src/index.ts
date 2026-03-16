import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/recommendation/health', (req, res) => {
  res.json({ status: 'ok', service: 'recommendation', port: PORT });
});

app.post('/api/recommendation/next', (req, res) => {
  const { currentScore, weakPhonemes } = req.body;
  
  // Adaptive engine logic
  const targetTopic = weakPhonemes && weakPhonemes.length > 0
    ? 'pronunciation'
    : 'general';
    
  let recommendedDifficulty = 'BEGINNER';
  if (currentScore > 75) recommendedDifficulty = 'INTERMEDIATE';
  if (currentScore > 90) recommendedDifficulty = 'ADVANCED';
  
  res.json({ recommendedDifficulty, targetTopic });
});

app.listen(PORT, () => {
  console.log(`🧠 Recommendation Microservice running on http://localhost:${PORT}`);
});
