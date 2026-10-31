import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): any {
    return {
      status: 'ok',
      service: 'AgriLens Rwanda Backend Intelligence API',
      version: '1.0.0',
      apiBase: '/api/v1',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth(): any {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
