import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('conversations')
@UseGuards(AuthGuard('jwt'))
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('scenarios')
  getScenarios() {
    return this.conversationsService.getScenarios();
  }

  @Post('start')
  startConversation(@Request() req, @Body('scenario') scenario: string) {
    return this.conversationsService.startConversation(req.user.userId, scenario);
  }

  @Get()
  getConversations(@Request() req) {
    return this.conversationsService.getConversations(req.user.userId);
  }

  @Get(':id')
  getConversation(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }

  @Post(':id/message')
  sendMessage(
    @Param('id') id: string,
    @Body('userMessage') userMessage: string,
    @Body('audioUrl') audioUrl?: string,
    @Body('score') score?: number,
    @Body('phonemeDiff') phonemeDiff?: any,
  ) {
    return this.conversationsService.sendMessage(id, userMessage, audioUrl, score, phonemeDiff);
  }
}
