import { Module } from '@nestjs/common';
import { GisController } from './gis.controller';
import { GisService } from './gis.service';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { PriorityZonesModule } from '../priority-zones/priority-zones.module';

@Module({
  imports: [PriorityZonesModule],
  controllers: [GisController, MapController],
  providers: [GisService, MapService],
})
export class GisModule {}
