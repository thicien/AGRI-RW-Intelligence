import { Module } from '@nestjs/common';
import { CropStatisticsController } from './crop-statistics.controller';
import { CropStatisticsService } from './crop-statistics.service';

@Module({
  controllers: [CropStatisticsController],
  providers: [CropStatisticsService]
})
export class CropStatisticsModule {}
