import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '../..', '.env'),
  ];
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const fileContent = fs.readFileSync(envPath, 'utf8');
        for (const line of fileContent.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      } catch (err) {}
      break;
    }
  }
}
loadEnv();

// function liberatePortIfOccupied(port: number) {
//   const logger = new Logger('PortGuard');
//   try {
//     if (process.platform === 'win32') {
//       const output = execSync('netstat -ano -p tcp', {
//         encoding: 'utf8',
//         stdio: ['pipe', 'pipe', 'ignore'],
//         windowsHide: true,
//       });
//       const lines = output.split('\n');
//       for (const line of lines) {
//         if (line.includes(`:${port}`) && line.toUpperCase().includes('LISTENING')) {
//           const parts = line.trim().split(/\s+/);
//           const pid = parseInt(parts[parts.length - 1], 10);
//           if (pid && !isNaN(pid) && pid !== process.pid) {
//             logger.warn(`Port ${port} occupied by orphaned PID ${pid}. Liberating port...`);
//             try {
//               execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', windowsHide: true });
//             } catch (e) {}
//           }
//         }
//       }
//     } else {
//       const output = execSync(`lsof -ti:${port}`, {
//         encoding: 'utf8',
//         stdio: ['pipe', 'pipe', 'ignore'],
//       });
//       const lines = output.trim().split('\n');
//       for (const line of lines) {
//         const pid = parseInt(line.trim(), 10);
//         if (pid && !isNaN(pid) && pid !== process.pid) {
//           logger.warn(`Port ${port} occupied by orphaned PID ${pid}. Liberating port...`);
//           try {
//             process.kill(pid, 'SIGKILL');
//           } catch (e) {}
//         }
//       }
//     }
//   } catch (err) {
//     // Ignore any inspection errors
//   }
// }

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const targetPort = parseInt(process.env.PORT || '3000', 10);

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'health'],
  });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(targetPort, '0.0.0.0');

  logger.log(
    `AgriLens Rwanda Backend listening on port ${targetPort}`,
  );
}

bootstrap();

