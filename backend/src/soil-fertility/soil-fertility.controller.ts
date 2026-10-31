import { Controller, Get, Query } from '@nestjs/common';
import { SoilFertilityService } from './soil-fertility.service';

@Controller('soil-fertility')
export class SoilFertilityController {
  constructor(private readonly soilFertilityService: SoilFertilityService) {}

  @Get('decision-workspace')
  async getDecisionWorkspace(
    @Query('season') season: string = '2025A',
    @Query('compareSeason') compareSeason?: string,
    @Query('province') province: string = 'ALL',
    @Query('layer') layer: string = 'ALL',
    @Query('projectType') projectType: string = 'ALL',
  ) {
    return this.soilFertilityService.getDecisionWorkspace(season, compareSeason, province, layer, projectType);
  }

  @Get('summary')
  async getSummary(@Query('season') season: string = '2026B') {
    return this.soilFertilityService.getSummary(season);
  }

  @Get('districts')
  async getDistricts(@Query('season') season: string = '2026B') {
    return this.soilFertilityService.getDistricts(season);
  }

  @Get('seasons')
  async getSeasons() {
    return this.soilFertilityService.getSeasons();
  }

  @Get('priority-ranking')
  async getPriorityRanking(@Query('season') season: string = '2026B') {
    return this.soilFertilityService.getPriorityRanking(season);
  }

  @Get('projects')
  async getProjects() {
    return this.soilFertilityService.getProjects();
  }

  @Get('correlation')
  async getHistoricalCorrelation(@Query('district') district: string = 'Gicumbi') {
    return this.soilFertilityService.getHistoricalCorrelation(district);
  }

  @Get('site-dossier')
  async getSiteDossier(
    @Query('district') district: string = 'Gicumbi',
    @Query('season') season: string = '2026B',
  ) {
    return this.soilFertilityService.getSiteDossier(district, season);
  }
}
