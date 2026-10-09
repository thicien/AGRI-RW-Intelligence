import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { Crop } from '../crops/entities/crop.entity';
import { Season } from '../seasons/entities/season.entity';
import { FarmCrop } from '../agricultural-data/entities/farm-crop.entity';
import { Farm } from '../agricultural-data/entities/farm.entity';
import { Village } from '../administrative-units/entities/village.entity';
import { AgriculturalObservation } from '../agricultural-data/entities/agricultural-observation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Crop, Season, FarmCrop, Farm, Village, AgriculturalObservation])],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
