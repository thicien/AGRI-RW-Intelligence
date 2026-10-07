import { Module } from '@nestjs/common';
import { ClimateController } from './climate.controller';
import { ClimateService } from './climate.service';

@Module({
  controllers: [ClimateController],
  providers: [ClimateService]
})
export class ClimateModule {}
