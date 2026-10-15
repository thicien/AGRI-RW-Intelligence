import { Controller, Get } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';

@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly service: InfrastructureService) {}

  @Get('facilities')
  async getFacilities() {
    return this.service.getFacilities();
  }

  @Get('capacity-analysis')
  async getCapacityAnalysis() {
    return this.service.getCapacityAnalysis();
  }
}
