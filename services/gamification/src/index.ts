import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/gamification/health', (req, res) => {
  res.json({ status: 'ok', service: 'gamification', port: PORT });
});

app.post('/api/gamification/calculate-xp', (req, res) => {
  const { score, difficulty, type } = req.body;
  // XP Calculation Logic
  let base = 10;
  if (difficulty === 'INTERMEDIATE') base += 5;
  if (difficulty === 'ADVANCED') base += 10;
  if (type === 'ROLEPLAY' || type === 'CONVERSATION') base += 10;
  
  // Multiply by score percentage
  const earnedXp = Math.max(5, Math.floor(base * ((score || 0) / 100)));
  
  res.json({ earnedXp });
});

app.post('/api/gamification/evaluate-badges', (req, res) => {
  const { totalXp, lessonsDone, perfectScores, streak } = req.body;
  
  const unlocked = [];
  
  if (lessonsDone >= 1) unlocked.push('First Step');
  if (lessonsDone >= 10) unlocked.push('Dedicated Learner');
  if (streak >= 3) unlocked.push('3-Day Streak');
  if (streak >= 7) unlocked.push('7-Day Streak');
  if (totalXp >= 1000) unlocked.push('XP Novice');
  if (totalXp >= 5000) unlocked.push('XP Master');
  if (perfectScores >= 5) unlocked.push('Perfectionist');

  res.json({ unlockedBadges: unlocked });
});

app.listen(PORT, () => {
  console.log(`🎮 Gamification Microservice running on http://localhost:${PORT}`);
});
