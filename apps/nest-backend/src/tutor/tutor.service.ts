import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);
  private genAI: GoogleGenerativeAI;
  private openai: any;

  constructor(private configService: ConfigService) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) this.genAI = new GoogleGenerativeAI(geminiKey);

    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      const OpenAI = require('openai');
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  async chat(message: string, history: any[] = []) {
    const systemPrompt = "You are an expert English language tutor. Explain grammar rules, offer pronunciation tips, and encourage the student. Be concise and friendly.";

    // 1. Try Gemini
    if (this.genAI) {
      try {
          const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood! I'm ready to help the student." }] },
            ...history.map((h: any) => ({
              role: h.role === 'USER' ? 'user' : 'model',
              parts: [{ text: h.content || h.message }]
            }))
          ]
        });
        const result = await chat.sendMessage(message);
        return { reply: result.response.text(), source: 'gemini' };
      } catch (err: any) {
        this.logger.error(`Gemini Error: ${err.message}`);
        if (!this.openai) {
          if (err.message?.includes('429')) return { reply: "Gemini is busy, and no backup (OpenAI) is configured." };
          return { reply: `AI Error: ${err.message}` };
        }
      }
    }

    // 2. Try OpenAI (GPT-4o-mini)
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.map((h: any) => ({
              role: h.role === 'USER' ? 'user' : 'assistant',
              content: h.content || h.message
            })),
            { role: "user", content: message }
          ]
        });
        return { reply: completion.choices[0].message.content, source: 'openai' };
      } catch (err: any) {
        this.logger.error(`OpenAI Error: ${err.message}`);
        return { reply: `AI Error (OpenAI): ${err.message}` };
      }
    }

    return { reply: `(No AI Provider) You said: "${message}". Please configure API keys in .env.` };
  }
}
