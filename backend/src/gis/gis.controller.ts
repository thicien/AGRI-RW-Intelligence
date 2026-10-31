import { Controller, Get, Param, Query } from '@nestjs/common';
import { GisService } from './gis.service';

@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  /**
   * 1. GET /api/v1/gis/intelligence-map
   * Returns unified intelligence across the 6 layers for all 30 districts
   */
  @Get('intelligence-map')
  async getIntelligenceMap(
    @Query('season') season?: string,
    @Query('compareSeason') compareSeason?: string,
  ) {
    return await this.gisService.getIntelligenceMap(season || '2026B', compareSeason || '2025B');
  }

  /**
   * 2. GET /api/v1/gis/facilities
   * Returns all 97 mapped warehouses, silos, cold storage, and processing plants
   */
  @Get('facilities')
  async getFacilities() {
    return await this.gisService.getFacilities();
  }

  /**
   * 3. GET /api/v1/gis/irrigation-assets
   * Returns all 20 mapped irrigation schemes and dams
   */
  @Get('irrigation-assets')
  async getIrrigationAssets() {
    return await this.gisService.getIrrigationAssets();
  }

  /**
   * 4. GET /api/v1/gis/district-dossier/:districtName
   * Returns multi-seasonal historical trend and crop intelligence for a district
   */
  @Get('district-dossier/:districtName')
  async getDistrictDossier(@Param('districtName') districtName: string) {
    return await this.gisService.getDistrictDossier(districtName);
  }
}
