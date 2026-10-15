import { Controller, Get, Query } from '@nestjs/common';
import { IrrigationService } from './irrigation.service';

@Controller('irrigation')
export class IrrigationController {
  constructor(private readonly service: IrrigationService) {}

  @Get('potential')
  async getPotential(@Query('season') season?: string) {
    return this.service.getPotential(season || '2025A');
  }

  @Get('assets')
  async getAssets() {
    return this.service.getAssets();
  }
}
