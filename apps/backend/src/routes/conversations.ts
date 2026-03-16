import { Router } from 'express';
import prisma from '../context/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Conversation scenarios map
const CONVERSATION_SCENARIOS: Record<string, { title: string; systemPrompt: string; opening: string }> = {
  restaurant: {
    title: 'Restaurant Ordering',
    systemPrompt: 'You are a friendly restaurant server. Keep responses to 2-3 sentences. Speak naturally. If the student orders, confirm and suggest one item. If unclear, politely ask for clarification. Stay in character the whole time.',
    opening: "Hi there! Welcome to The English Café! My name is Alex, and I'll be your server today. Can I start you off with something to drink, or are you ready to order?",
  },
  interview: {
    title: 'Job Interview',
    systemPrompt: 'You are an experienced HR interviewer at a tech company. Ask professional interview questions. Respond to answers with brief feedback and the next question. Keep it realistic but encouraging.',
    opening: "Hello, thank you for coming in today! I'm Sarah from HR. Before we begin, tell me — can you walk me through your background and what brings you to apply for this position?",
  },
  travel: {
    title: 'Travel & Airport',
    systemPrompt: 'You are a helpful airport information officer. Answer travel-related questions, give directions, and handle check-in scenarios. Keep responses concise and friendly.',
    opening: "Good morning, welcome to the airport! I'm at the information desk. How can I help you today? Are you looking for check-in, departures, or something else?",
  },
  daily: {
    title: 'Daily Conversations',
    systemPrompt: 'You are a friendly neighbor or colleague having a casual conversation. Topics can include weather, hobbies, weekend plans, local events. Keep the conversation natural and engaging.',
    opening: "Hey, good morning! Beautiful day today, isn't it? Are you heading to work?",
  },
  business: {
    title: 'Business Presentation',
    systemPrompt: 'You are a business executive in a meeting. The student is presenting a project idea. Ask relevant business questions, challenge assumptions professionally, and encourage clarity.',
    opening: "Good afternoon, everyone. I've reviewed your proposal briefly, but I'd love to hear you walk us through the main points. Please go ahead.",
  },
  doctor: {
    title: 'Doctor Visit',
    systemPrompt: 'You are a friendly doctor at a clinic. Ask about symptoms naturally, listen to concerns, and give appropriate advice to practice medical English vocabulary.',
    opening: "Hello! Come on in. I'm Dr. Johnson. So what brings you in today? How are you feeling?",
  },
  shopping: {
    title: 'Shopping',
    systemPrompt: 'You are a retail shop assistant. Help the customer find items, suggest alternatives, handle payments scenario. Be friendly and helpful.',
    opening: "Hi there, welcome to the store! Is there anything specific I can help you find today?",
  },
  hotel: {
    title: 'Hotel Check-in',
    systemPrompt: 'You are a professional hotel receptionist. Handle check-in, answer questions about amenities, and help with common hotel requests.',
    opening: "Welcome to the Grand Hotel! How can I assist you today? Do you have a reservation with us?",
  },
};

// GET /api/conversations/scenarios - List available scenarios
router.get('/scenarios', authenticate, async (req: AuthRequest, res) => {
  const scenarios = Object.entries(CONVERSATION_SCENARIOS).map(([id, s]) => ({
    id,
    title: s.title,
    opening: s.opening,
  }));
  res.json(scenarios);
});

// POST /api/conversations/start - Start new conversation
router.post('/start', authenticate, async (req: AuthRequest, res) => {
  const { scenario } = req.body;
  const scenarioData = CONVERSATION_SCENARIOS[scenario];
  if (!scenarioData) return res.status(400).json({ error: 'Invalid scenario' });

  try {
    const conversation = await prisma.conversation.create({
      data: {
        title: scenarioData.title,
        scenario,
        userId: req.user!.userId,
        messages: {
          create: {
            role: 'AI',
            content: scenarioData.opening,
          },
        },
      },
      include: { messages: true },
    });
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// POST /api/conversations/:id/message - Send message to AI
router.post('/:id/message', authenticate, async (req: AuthRequest, res) => {
  const { userMessage, audioUrl, score } = req.body;
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: req.params.id,
        role: 'USER',
        content: userMessage,
        audioUrl: audioUrl || null,
        score: score ? parseFloat(score) : null,
      },
    });

    // Generate AI reply using configured real AI provider (Gemini or OpenAI)
    const scenarioData = CONVERSATION_SCENARIOS[conversation.scenario] || CONVERSATION_SCENARIOS.daily;
    const aiReply = await generateRealAIReply(scenarioData, conversation.messages, userMessage);

    const aiMessage = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        role: 'AI',
        content: aiReply,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });

    res.json({ reply: aiReply, message: aiMessage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/conversations - List user's conversations
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.user!.userId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/conversations/:id - Get conversation with messages
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

function generateMockAIReply(scenario: string, userMessage: string, turn: number): string {
  return `(MOCK AI MODE) - Please add your free GEMINI_API_KEY or OPENAI_API_KEY to apps/backend/.env to unlock exact, intelligent conversations! Your message was: "${userMessage}"`;
}

// Helper to get real AI reply
async function generateRealAIReply(scenarioData: any, conversationHistory: any[], userMessage: string): Promise<string> {
  // If no API keys are configured, return the informative mock message
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return generateMockAIReply(scenarioData.title, userMessage, conversationHistory.length);
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      // Use Gemini API
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: scenarioData.systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I will stay strictly in character." }] },
          ...conversationHistory.map(msg => ({
            role: msg.role === 'USER' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }))
        ],
      });

      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    }
    
    if (process.env.OPENAI_API_KEY) {
      // Use OpenAI API
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: scenarioData.systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role === 'USER' ? "user" : "assistant",
            content: msg.content
          })),
          { role: "user", content: userMessage }
        ]
      });
      return completion.choices[0].message.content || "Sorry, I couldn't respond.";
    }
  } catch (err: any) {
    console.error('AI API Error:', err.message || err);
    return `(AI Error) - The AI service was unable to process the request. ${err.message || ''}`;
  }

  return "I'm sorry, I'm experiencing technical difficulties.";
}

export default router;
