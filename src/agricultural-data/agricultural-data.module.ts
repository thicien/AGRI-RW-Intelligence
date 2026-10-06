import { Module } from '@nestjs/common';
import { AgriculturalDataController } from './agricultural-data.controller';
import { AgriculturalDataService } from './agricultural-data.service';

@Module({
  controllers: [AgriculturalDataController],
  providers: [AgriculturalDataService]
})
export class AgriculturalDataModule {}
