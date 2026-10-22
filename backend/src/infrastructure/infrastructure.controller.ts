import { Controller, Get, Param, Query } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';

@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly service: InfrastructureService) {}

  @Get('facilities')
  async getFacilities(
    @Query('type') type?: string,
    @Query('district') district?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getFacilities({ type, district, search });
  }

  @Get('facilities/:id')
  async getFacilityById(@Param('id') id: string) {
    return this.service.getFacilityById(id);
  }

  @Get('capacity-analysis')
  async getCapacityAnalysis() {
    return this.service.getCapacityAnalysis();
  }
}
