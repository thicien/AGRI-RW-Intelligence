import { Controller, Post, Get, HttpCode } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('run')
  @HttpCode(200)
  async runIngestion() {
    return await this.ingestionService.runAgriculturalIngestion();
  }

  @Get('jobs')
  async getJobs() {
    return await this.ingestionService.getJobs();
  }
}
