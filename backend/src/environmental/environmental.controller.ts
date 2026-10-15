import { Controller, Get, Query } from '@nestjs/common';
import { EnvironmentalService } from './environmental.service';

@Controller('environmental')
export class EnvironmentalController {
  constructor(private readonly service: EnvironmentalService) {}

  @Get('soil-fertility')
  async getSoilFertility() {
    return this.service.getSoilFertility();
  }

  @Get('conservation-practices')
  async getConservationPractices(@Query('season') season?: string) {
    return this.service.getConservationPractices(season || '2025A');
  }

  @Get('seasonal-comparison')
  async getSeasonalComparison() {
    return this.service.getSeasonalComparison();
  }
}
