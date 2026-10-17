import { Controller, Get, Query } from '@nestjs/common';
import { CropStatisticsService } from './crop-statistics.service';

@Controller('crop-statistics')
export class CropStatisticsController {
  constructor(private readonly service: CropStatisticsService) {}

  @Get('summary')
  async getSummary(@Query('season') season?: string) {
    return this.service.getSummary(season || '2025A');
  }

  @Get('district-comparison')
  async getDistrictComparisons(
    @Query('crop') crop?: string,
    @Query('season') season?: string,
  ) {
    return this.service.getDistrictComparisons(crop || 'Maize', season || '2025A');
  }

  @Get('seasonal-comparison')
  async getSeasonalComparison(
    @Query('crop') crop?: string,
    @Query('year') year?: string,
  ) {
    return this.service.getSeasonalComparison(crop || 'Maize', parseInt(year || '2025', 10));
  }

  @Get('historical-trends')
  async getMultiYearTrends(
    @Query('crop') crop?: string,
    @Query('district') district?: string,
  ) {
    return this.service.getMultiYearTrends(crop || 'Maize', district);
  }

  @Get('underperforming-areas')
  async getUnderperformingAreas(
    @Query('season') season?: string,
    @Query('crop') crop?: string,
  ) {
    return this.service.getUnderperformingAreas(season || '2025A', crop || 'Maize');
  }

  @Get('district-dossier')
  async getDistrictInvestigationDossier(
    @Query('district') district?: string,
    @Query('crop') crop?: string,
    @Query('season') season?: string,
  ) {
    return this.service.getDistrictInvestigationDossier(
      district || 'RW-05-07', // Bugesera default
      crop || 'Maize',
      season || '2025A',
    );
  }

  @Get('crops')
  async getCropsMasterList() {
    return this.service.getCropsMasterList();
  }

  @Get('seasons')
  async getSeasonsMasterList() {
    return this.service.getSeasonsMasterList();
  }

  @Get('data-quality')
  async getDataQualityReport() {
    return this.service.getDataQualityReport();
  }
}

