"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
function liberatePortIfOccupied(port) {
    const logger = new common_1.Logger('PortGuard');
    try {
        if (process.platform === 'win32') {
            const output = (0, child_process_1.execSync)('netstat -ano -p tcp', {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore'],
                windowsHide: true,
            });
            const lines = output.split('\n');
            for (const line of lines) {
                if (line.includes(`:${port}`) && line.toUpperCase().includes('LISTENING')) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parseInt(parts[parts.length - 1], 10);
                    if (pid && !isNaN(pid) && pid !== process.pid) {
                        logger.warn(`Port ${port} occupied by orphaned PID ${pid}. Liberating port...`);
                        try {
                            (0, child_process_1.execSync)(`taskkill /F /PID ${pid}`, { stdio: 'ignore', windowsHide: true });
                        }
                        catch (e) { }
                    }
                }
            }
        }
        else {
            const output = (0, child_process_1.execSync)(`lsof -ti:${port}`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore'],
            });
            const lines = output.trim().split('\n');
            for (const line of lines) {
                const pid = parseInt(line.trim(), 10);
                if (pid && !isNaN(pid) && pid !== process.pid) {
                    logger.warn(`Port ${port} occupied by orphaned PID ${pid}. Liberating port...`);
                    try {
                        process.kill(pid, 'SIGKILL');
                    }
                    catch (e) { }
                }
            }
        }
    }
    catch (err) {
    }
}
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const targetPort = parseInt(process.env.PORT ?? '3000', 10);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    try {
        await app.listen(targetPort);
        logger.log(`AgriLens Rwanda Backend listening on port ${targetPort} (http://localhost:${targetPort}/api/v1)`);
    }
    catch (err) {
        if (err?.code === 'EADDRINUSE') {
            logger.warn(`EADDRINUSE detected on port ${targetPort}. Freeing port and retrying...`);
            liberatePortIfOccupied(targetPort);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await app.listen(targetPort);
            logger.log(`AgriLens Rwanda Backend recovered and listening on port ${targetPort} (http://localhost:${targetPort}/api/v1)`);
        }
        else {
            throw err;
        }
    }
}
bootstrap();
//# sourceMappingURL=main.js.map