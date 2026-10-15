import { Controller, Get, Query } from '@nestjs/common';
import { CropStatisticsService } from './crop-statistics.service';

@Controller('crop-statistics')
export class CropStatisticsController {
  constructor(private readonly service: CropStatisticsService) {}

  @Get('summary')
  async getSummary(@Query('season') season?: string) {
    return this.service.getSummary(season || '2025A');
  }

  @Get('by-crop')
  async getByCrop(
    @Query('crop') crop?: string,
    @Query('season') season?: string,
  ) {
    return this.service.getByCrop(crop, season || '2025A');
  }

  @Get('trends')
  async getTrends() {
    return this.service.getTrends();
  }
}
