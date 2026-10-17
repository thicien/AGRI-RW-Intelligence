import { Module } from '@nestjs/common';
import { SoilFertilityService } from './soil-fertility.service';
import { SoilFertilityController } from './soil-fertility.controller';

@Module({
  controllers: [SoilFertilityController],
  providers: [SoilFertilityService],
  exports: [SoilFertilityService],
})
export class SoilFertilityModule {}
