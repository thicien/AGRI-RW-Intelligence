import { Module } from '@nestjs/common';
import { DataManagerController } from './data-manager.controller';
import { DataManagerService } from './data-manager.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'agrilens-secret-key-rwanda-2026',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [DataManagerController],
  providers: [DataManagerService],
  exports: [DataManagerService],
})
export class DataManagerModule {}
