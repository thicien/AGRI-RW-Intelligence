import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('export-intelligence')
  async getExportIntelligence() {
    return this.service.getExportIntelligence();
  }

  @Get('export-opportunities')
  async getExportOpportunities() {
    return this.service.getExportOpportunities();
  }
}
