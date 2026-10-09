import { Controller, Get, Query } from '@nestjs/common';
import { MapService } from './map.service';

@Controller('api/map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('priority-zones')
  async getPriorityZones(@Query('districtId') districtId?: string) {
    return this.mapService.getPriorityZonesGeoJson(districtId ? parseInt(districtId) : undefined);
  }

  @Get('farms')
  async getFarms(@Query('villageId') villageId?: string) {
    return this.mapService.getFarmsGeoJson(villageId ? parseInt(villageId) : undefined);
  }

  @Get('irrigation-opportunities')
  async getIrrigationOpportunities() {
    return this.mapService.getIrrigationOpportunitiesGeoJson();
  }
}
