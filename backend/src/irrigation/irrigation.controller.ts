import { Controller, Get, Query } from '@nestjs/common';
import { IrrigationService } from './irrigation.service';

@Controller('irrigation')
export class IrrigationController {
  constructor(private readonly service: IrrigationService) {}

  /**
   * 1. Overview summary across national irrigation footprint
   */
  @Get('summary')
  async getSummary(@Query('season') season?: string) {
    return this.service.getSummary(season || '2026B');
  }

  /**
   * 2. All 30 Districts irrigation metrics & gap for a season
   */
  @Get('districts')
  async getDistricts(@Query('season') season?: string) {
    return this.service.getDistricts(season || '2026B');
  }

  /**
   * 3. Available monitored seasons
   */
  @Get('seasons')
  async getSeasons() {
    return this.service.getSeasons();
  }

  /**
   * 4. Multi-criteria small-scale irrigation opportunity screening & ranking
   */
  @Get('opportunity-screening')
  async getOpportunityScreening(@Query('season') season?: string) {
    return this.service.getOpportunityScreening(season || '2026B');
  }

  /**
   * 5. Documented irrigation schemes & GeoJSON
   */
  @Get('schemes')
  async getSchemes() {
    return this.service.getSchemes();
  }

  /**
   * 6. Engineering pre-feasibility dossier for a selected district
   */
  @Get('site-dossier')
  async getSiteDossier(
    @Query('district') district?: string,
    @Query('season') season?: string,
  ) {
    const d = district || 'Bugesera';
    const s = season || '2026B';
    return this.service.getSiteDossier(d, s);
  }

  /**
   * Legacy backward-compatibility endpoints
   */
  @Get('potential')
  async getPotentialLegacy(@Query('season') season?: string) {
    return this.service.getOpportunityScreening(season || '2026B');
  }

  @Get('assets')
  async getAssetsLegacy() {
    return this.service.getSchemes();
  }
}
