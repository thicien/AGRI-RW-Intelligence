import { Module } from '@nestjs/common';
import { PostHarvestService } from './post-harvest.service';
import { PostHarvestController } from './post-harvest.controller';

@Module({
  controllers: [PostHarvestController],
  providers: [PostHarvestService],
  exports: [PostHarvestService],
})
export class PostHarvestModule {}
