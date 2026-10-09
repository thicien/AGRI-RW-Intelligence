import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgriculturalDataController } from './agricultural-data.controller';
import { AgriculturalDataService } from './agricultural-data.service';
import { Farm } from './entities/farm.entity';
import { FarmCrop } from './entities/farm-crop.entity';
import { AgriculturalObservation } from './entities/agricultural-observation.entity';
import { Crop } from '../crops/entities/crop.entity';
import { Season } from '../seasons/entities/season.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Farm, FarmCrop, AgriculturalObservation, Crop, Season])],
  controllers: [AgriculturalDataController],
  providers: [AgriculturalDataService],
  exports: [AgriculturalDataService]
})
export class AgriculturalDataModule {}
