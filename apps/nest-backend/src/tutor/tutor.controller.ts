import { Controller, Post, Body, Get } from '@nestjs/common';
import { TutorService } from './tutor.service';

@Controller('tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'ai-tutor' };
  }

  @Post('chat')
  async chat(@Body() body: any) {
    const { message, history } = body;
    return this.tutorService.chat(message, history);
  }
}
