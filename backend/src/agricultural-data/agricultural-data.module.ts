import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgriculturalDataController } from './agricultural-data.controller';
import { AgriculturalDataService } from './agricultural-data.service';
import { Farm } from './entities/farm.entity';
import { FarmCrop } from './entities/farm-crop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Farm, FarmCrop])],
  controllers: [AgriculturalDataController],
  providers: [AgriculturalDataService],
  exports: [AgriculturalDataService]
})
export class AgriculturalDataModule {}
