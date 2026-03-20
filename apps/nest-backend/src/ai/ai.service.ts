import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly PRONUNCIATION_SERVICE: string;
  private readonly RAPIDAPI_KEY: string | undefined;
  private readonly RAPIDAPI_HOST: string;

  constructor(private configService: ConfigService) {
    this.PRONUNCIATION_SERVICE = this.configService.get<string>('PYTHON_ENGINE_URL') || 'http://localhost:5001';
    this.RAPIDAPI_KEY = this.configService.get<string>('RAPIDAPI_KEY');
    this.RAPIDAPI_HOST = this.configService.get<string>('RAPIDAPI_HOST') || 'pronunciation-assessment-service.p.rapidapi.com';
  }

  async getHealth() {
    let pronunciationStatus = 'unavailable';
    try {
      const { data } = await axios.get(`${this.PRONUNCIATION_SERVICE}/api/pronunciation/health`, { timeout: 2000 });
      pronunciationStatus = data.status === 'ok' ? 'ok' : 'degraded';
    } catch {
      // ignore
    }
    return {
      status: 'ok',
      pronunciationService: pronunciationStatus,
    };
  }

  async analyzePronunciation(targetText: string, file: Express.Multer.File, clientTranscript?: string) {
    // 1. Try Python Engine
    if (file) {
      try {
        const form = new FormData();
        form.append('audio', fs.createReadStream(file.path), {
          filename: file.originalname,
          contentType: file.mimetype,
        });
        form.append('targetText', targetText || '');

        const { data } = await axios.post(
          `${this.PRONUNCIATION_SERVICE}/api/pronunciation/analyze`,
          form,
          { headers: form.getHeaders(), timeout: 60_000 }
        );

        // Cleanup temp file
        fs.unlink(file.path, () => {});

        return { ...data, source: 'whisper+speechbrain' };
      } catch (err) {
        this.logger.warn(`Python pronunciation service unavailable: ${err.message}. Falling back.`);
      }
    }

    // 2. Try RapidAPI fallback
    if (file && this.RAPIDAPI_KEY) {
      try {
        const form = new FormData();
        form.append('audio', fs.createReadStream(file.path), {
          filename: file.originalname,
          contentType: file.mimetype,
        });
        form.append('targetText', targetText || '');

        const rapidRes = await axios.post(
          `https://${this.RAPIDAPI_HOST}/pronunciation`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'X-RapidAPI-Key': this.RAPIDAPI_KEY,
              'X-RapidAPI-Host': this.RAPIDAPI_HOST,
            },
            timeout: 45_000,
          }
        );

        fs.unlink(file.path, () => {});
        const data = rapidRes.data;
        return {
          score: data.score || data.overall_score || 80,
          source: 'rapidapi-service',
          // ... mapping other fields as done in Express service ...
          feedback: data.feedback || 'Great pronunciation!',
        };
      } catch (err) {
        this.logger.warn(`RapidAPI error: ${err.message}. Falling back to word-match.`);
      }
    }

    // 3. Last fallback: Word-match scoring (already logic-rich in Express, port it)
    if (file?.path) fs.unlink(file.path, () => {});
    return this.calculateLocalScore(targetText, clientTranscript);
  }

  private calculateLocalScore(targetText: string, clientTranscript?: string) {
    const tWords = (targetText || '').toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);
    const sWords = (clientTranscript || '').toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);

    let matchCount = 0;
    const phonemeDiff = tWords.map((tw: string) => {
      const matched = sWords.some(sw => sw === tw || sw.replace(/[^a-z]/g, '') === tw.replace(/[^a-z]/g, ''));
      if (matched) matchCount++;
      return { word: tw, correct: matched, similarity: matched ? 1.0 : 0.0 };
    });

    const baseScore = tWords.length ? Math.round((matchCount / tWords.length) * 100) : 85;
    return {
      score: baseScore,
      phonemeDiff,
      feedback: 'Local word-match scoring used.',
      source: 'word-match-fallback'
    };
  }

  async transcribe(file: Express.Multer.File) {
    if (!file) throw new Error('No audio file');
    try {
      const form = new FormData();
      form.append('audio', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const { data } = await axios.post(
        `${this.PRONUNCIATION_SERVICE}/api/pronunciation/transcribe-only`,
        form,
        { headers: form.getHeaders(), timeout: 45_000 }
      );
      fs.unlink(file.path, () => {});
      return data;
    } catch (err) {
      if (file?.path) fs.unlink(file.path, () => {});
      throw new Error(`Transcription service unavailable: ${err.message}`);
    }
  }

  async generateConversation(scenario: string, history: any[] = []) {
    // Ported from Express logic or can use real Gemini integration here
    const scenarioKey = scenario || 'restaurant';
    const replies = {
      restaurant: ['Great choice! Drink?', 'Today special salmon', 'Order in!'],
      interview: ['Impressive challenge?', 'Five years where?', 'Greatest strength?']
    };
    const list = replies[scenarioKey] || replies.restaurant;
    const reply = list[history.length % list.length];
    return { reply, audioUrl: null };
  }
}
