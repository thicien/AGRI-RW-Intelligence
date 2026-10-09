import { Module } from '@nestjs/common';
import { PriorityZonesController } from './priority-zones.controller';
import { PriorityZonesService } from './priority-zones.service';

@Module({
  controllers: [PriorityZonesController],
  providers: [PriorityZonesService],
  exports: [PriorityZonesService]
})
export class PriorityZonesModule {}
