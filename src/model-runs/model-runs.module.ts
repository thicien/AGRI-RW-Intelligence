import { Module } from '@nestjs/common';
import { ModelRunsController } from './model-runs.controller';
import { ModelRunsService } from './model-runs.service';

@Module({
  controllers: [ModelRunsController],
  providers: [ModelRunsService]
})
export class ModelRunsModule {}
