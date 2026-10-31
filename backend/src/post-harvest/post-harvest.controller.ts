import { Controller, Get, Query } from '@nestjs/common';
import { PostHarvestService } from './post-harvest.service';

@Controller('post-harvest')
export class PostHarvestController {
  constructor(private readonly postHarvestService: PostHarvestService) {}

  @Get('decision-workspace')
  async getDecisionWorkspace(
    @Query('season') season: string = '2025A',
    @Query('compareSeason') compareSeason?: string,
    @Query('province') province: string = 'ALL',
    @Query('layer') layer: string = 'ALL',
    @Query('facilityType') facilityType: string = 'ALL',
    @Query('crop') crop: string = 'ALL',
  ) {
    return this.postHarvestService.getDecisionWorkspace(
      season,
      compareSeason,
      province,
      layer,
      facilityType,
      crop,
    );
  }

  @Get('summary')
  async getSummary(@Query('season') season: string = '2026B') {
    return this.postHarvestService.getSummary(season);
  }

  @Get('districts')
  async getDistricts(@Query('season') season: string = '2026B') {
    return this.postHarvestService.getDistricts(season);
  }

  @Get('seasons')
  async getSeasons() {
    return this.postHarvestService.getSeasons();
  }

  @Get('facilities')
  async getFacilities() {
    return this.postHarvestService.getFacilities();
  }

  @Get('gap-screening')
  async getGapScreening(@Query('season') season: string = '2026B') {
    return this.postHarvestService.getGapScreening(season);
  }

  @Get('site-dossier')
  async getSiteDossier(
    @Query('district') district: string = 'Nyagatare',
    @Query('season') season: string = '2026B',
  ) {
    return this.postHarvestService.getSiteDossier(district, season);
  }
}
