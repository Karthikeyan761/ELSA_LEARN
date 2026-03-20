import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import OpenAI from 'openai';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  private readonly CONVERSATION_SCENARIOS: Record<string, { title: string; systemPrompt: string; opening: string }> = {
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

  getScenarios() {
    return Object.entries(this.CONVERSATION_SCENARIOS).map(([id, s]) => ({
      id,
      title: s.title,
      opening: s.opening,
    }));
  }

  async startConversation(userId: string, scenario: string) {
    const scenarioData = this.CONVERSATION_SCENARIOS[scenario];
    if (!scenarioData) throw new Error('Invalid scenario');

    return this.prisma.conversation.create({
      data: {
        title: scenarioData.title,
        scenario,
        userId,
        messages: {
          create: {
            role: 'AI',
            content: scenarioData.opening,
          },
        },
      },
      include: { messages: true },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async sendMessage(id: string, userMessage: string, audioUrl?: string, score?: number, phonemeDiff?: any) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new Error('Conversation not found');

    await this.prisma.message.create({
      data: {
        conversationId: id,
        role: 'USER',
        content: userMessage,
        audioUrl: audioUrl || null,
        score: score ? parseFloat(score as any) : null,
        phonemeDiff: phonemeDiff ? (typeof phonemeDiff === 'string' ? JSON.parse(phonemeDiff) : phonemeDiff) : null,
      } as any,
    });

    const scenarioData = this.CONVERSATION_SCENARIOS[conversation.scenario] || this.CONVERSATION_SCENARIOS.daily;
    const aiReply = await this.generateAIReply(scenarioData, conversation.messages, userMessage);

    const aiMessage = await this.prisma.message.create({
      data: {
        conversationId: id,
        role: 'AI',
        content: aiReply,
      },
    });

    await this.prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return { reply: aiReply, message: aiMessage };
  }

  private async generateAIReply(scenarioData: any, history: any[], userMessage: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return `(MOCK AI MODE) - Please add API keys to apps/nest-backend/.env! Your message was: "${userMessage}"`;
    }

    try {
      if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const geminiHistory: Content[] = [
          { role: "user", parts: [{ text: scenarioData.systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I will stay strictly in character." }] },
          ...history.map(msg => ({
            role: msg.role === 'USER' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }))
        ];

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(userMessage);
        return result.response.text();
      }

      if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: scenarioData.systemPrompt },
            ...history.map(msg => ({
              role: (msg.role === 'USER' ? "user" : "assistant") as any,
              content: msg.content
            })),
            { role: "user", content: userMessage }
          ]
        });
        return completion.choices[0].message.content || "Sorry, I couldn't respond.";
      }
    } catch (err: any) {
      console.error('AI Error:', err);
      return `(AI Error) - ${err.message}`;
    }

    return "Technical error occurred.";
  }
}
