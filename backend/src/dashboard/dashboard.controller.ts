import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(
    @Query('year') year?: string,
    @Query('season') season?: string,
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('crop') crop?: string,
    @Query('mode') mode?: string,
    @Query('mapLayer') mapLayer?: string,
  ) {
    return this.dashboardService.getOverview({ year, season, province, district, crop, mode, mapLayer });
  }
}
