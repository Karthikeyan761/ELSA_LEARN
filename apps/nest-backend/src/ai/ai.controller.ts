import { Controller, Post, Body, Get, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  async getHealth() {
    return this.aiService.getHealth();
  }

  @Post('analyze-pronunciation')
  @UseInterceptors(FileInterceptor('audio', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    })
  }))
  async analyzePronunciation(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    const { targetText, transcript } = body;
    return this.aiService.analyzePronunciation(targetText, file, transcript);
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    })
  }))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    return this.aiService.transcribe(file);
  }

  @Post('generate-conversation')
  async generateConversation(@Body() body: any) {
    const { scenario, history } = body;
    return this.aiService.generateConversation(scenario, history);
  }
}
