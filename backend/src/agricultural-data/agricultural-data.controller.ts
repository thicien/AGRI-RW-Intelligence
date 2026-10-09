import { Controller, Get, Query, Param } from '@nestjs/common';
import { AgriculturalDataService } from './agricultural-data.service';

@Controller('agricultural-data')
export class AgriculturalDataController {
  constructor(private readonly dataService: AgriculturalDataService) {}

  @Get('observations')
  async getObservations(@Query('limit') limit = 50, @Query('skip') skip = 0) {
    return this.dataService.getObservations(Number(limit), Number(skip));
  }

  @Get('kpis')
  async getKpis() {
    return this.dataService.getKpis();
  }

  @Get('trends')
  async getTrends(@Query('cropId') cropId?: string, @Query('seasonId') seasonId?: string) {
    return this.dataService.getTrends(cropId, seasonId);
  }

  @Get('season-comparison')
  async getSeasonComparison(@Query('cropId') cropId?: string) {
    return this.dataService.getSeasonComparison(cropId);
  }

  @Get('geography')
  async getGeographicStats(@Query('cropId') cropId?: string) {
    return this.dataService.getGeographicStats(cropId);
  }

  @Get('crops/:id')
  async getCropStats(@Param('id') id: string) {
    return this.dataService.getCropStats(id);
  }

  @Get('reseed')
  async reseed() {
    await this.dataService.reseed();
    return { success: true, message: 'Database re-seeded with 23 crops' };
  }

  @Get('matrix')
  async getMatrix(@Query('year') year?: string, @Query('seasonId') seasonId?: string) {
    return this.dataService.getMatrix(year ? Number(year) : undefined, seasonId);
  }
}
