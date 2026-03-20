import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async chat(message: string, history: any[] = []) {
    if (!this.genAI) {
      return { reply: `(Tutor Mock Mode) You said: "${message}". Please configure GEMINI_API_KEY in .env to unlock real AI.` };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = "You are an expert English language tutor. Explain grammar rules, offer pronunciation tips, and encourage the student. Be concise and friendly.";

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
      return { reply: result.response.text() };
    } catch (err) {
      this.logger.error(`Gemini AI Error: ${err.message}`);
      return { reply: `AI Error: ${err.message}` };
    }
  }
}
