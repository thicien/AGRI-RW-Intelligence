import { Controller, Post, HttpCode } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('api/ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('run')
  @HttpCode(200)
  async runIngestion() {
    return await this.ingestionService.runAgriculturalIngestion();
  }
}
