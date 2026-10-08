import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { Season } from './entities/season.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Season])],
  controllers: [SeasonsController],
  providers: [SeasonsService],
  exports: [SeasonsService]
})
export class SeasonsModule {}
