import { Module } from '@nestjs/common';
import { InterventionFeedbackController } from './intervention-feedback.controller';
import { InterventionFeedbackService } from './intervention-feedback.service';

@Module({
  controllers: [InterventionFeedbackController],
  providers: [InterventionFeedbackService]
})
export class InterventionFeedbackModule {}
