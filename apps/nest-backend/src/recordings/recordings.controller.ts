import { Controller, Post, Get, UseGuards, Request, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = join(__dirname, '..', '..', 'uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@Controller('recordings')
@UseGuards(AuthGuard('jwt'))
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('audio', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadRecording(@Request() req, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.recordingsService.uploadRecording(req.user.userId, file, body);
  }

  @Get('my')
  getMyRecordings(@Request() req) {
    return this.recordingsService.getMyRecordings(req.user.userId);
  }

  @Get('stats')
  getMyStats(@Request() req) {
    return this.recordingsService.getMyStats(req.user.userId);
  }
}
