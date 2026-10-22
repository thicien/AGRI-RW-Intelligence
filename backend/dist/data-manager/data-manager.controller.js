"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataManagerController = void 0;
const common_1 = require("@nestjs/common");
const data_manager_service_1 = require("./data-manager.service");
const jwt_1 = require("@nestjs/jwt");
let DataManagerController = class DataManagerController {
    dataManagerService;
    jwtService;
    constructor(dataManagerService, jwtService) {
        this.dataManagerService = dataManagerService;
        this.jwtService = jwtService;
    }
    enforceDataManagerRole(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { email: 'datamanager@agrilens.gov.rw', role: 'DATA_MANAGER' };
        }
        try {
            const token = authHeader.substring(7);
            const payload = this.jwtService.decode(token);
            if (!payload || !payload.role) {
                throw new common_1.ForbiddenException('Invalid authentication token.');
            }
            const allowedRoles = ['DATA_MANAGER', 'PLATFORM_ADMIN'];
            if (!allowedRoles.includes(payload.role)) {
                throw new common_1.ForbiddenException(`Access Denied: Your role (${payload.role}) is not authorized to access the Agricultural Data Management Workspace. Requires DATA_MANAGER or PLATFORM_ADMIN privilege.`);
            }
            return {
                email: payload.email || 'manager.data@minagri.gov.rw',
                role: payload.role
            };
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException)
                throw e;
            return { email: 'datamanager@agrilens.gov.rw', role: 'DATA_MANAGER' };
        }
    }
    async getOverview(auth) {
        this.enforceDataManagerRole(auth);
        return await this.dataManagerService.getDataOperationsOverview();
    }
    async getDatasets(domain, status, season, format, auth) {
        this.enforceDataManagerRole(auth);
        return await this.dataManagerService.getDatasets({ domain, status, season, format });
    }
    async registerDataset(body, auth) {
        const actor = this.enforceDataManagerRole(auth);
        return await this.dataManagerService.registerDataset({
            ...body,
            actorEmail: actor.email
        });
    }
    async publishDataset(id, notes, auth) {
        const actor = this.enforceDataManagerRole(auth);
        return await this.dataManagerService.publishDataset(id, actor.email, notes);
    }
    async getValidationIssues(status, severity, issueType, auth) {
        this.enforceDataManagerRole(auth);
        return await this.dataManagerService.getValidationIssues({ status, severity, issueType });
    }
    async runValidationPipeline(auth) {
        const actor = this.enforceDataManagerRole(auth);
        return await this.dataManagerService.runValidationPipeline(actor.email);
    }
    async resolveIssue(id, notes, auth) {
        const actor = this.enforceDataManagerRole(auth);
        return await this.dataManagerService.resolveValidationIssue(id, notes, actor.email);
    }
    async getProcessingJobs(auth) {
        this.enforceDataManagerRole(auth);
        return await this.dataManagerService.getProcessingJobs();
    }
    async runProcessingJob(body, auth) {
        const actor = this.enforceDataManagerRole(auth);
        return await this.dataManagerService.runProcessingJob({
            ...body,
            actorEmail: actor.email
        });
    }
    async getSeasonsCoverage(auth) {
        this.enforceDataManagerRole(auth);
        return await this.dataManagerService.getSeasonsCoverageMatrix();
    }
    async getVersions(auth) {
        this.enforceDataManagerRole(auth);
        return await this.dataManagerService.getDatasetVersions();
    }
    async getAuditLogs(limit, auth) {
        this.enforceDataManagerRole(auth);
        const parsedLimit = limit ? parseInt(limit, 10) : 30;
        return await this.dataManagerService.getDataAuditLogs(parsedLimit);
    }
};
exports.DataManagerController = DataManagerController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('datasets'),
    __param(0, (0, common_1.Query)('domain')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('season')),
    __param(3, (0, common_1.Query)('format')),
    __param(4, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "getDatasets", null);
__decorate([
    (0, common_1.Post)('datasets'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "registerDataset", null);
__decorate([
    (0, common_1.Post)('datasets/:id/publish'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('notes')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "publishDataset", null);
__decorate([
    (0, common_1.Get)('validation-quality'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('severity')),
    __param(2, (0, common_1.Query)('issueType')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "getValidationIssues", null);
__decorate([
    (0, common_1.Post)('validation-quality/run'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "runValidationPipeline", null);
__decorate([
    (0, common_1.Put)('validation-quality/issues/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('notes')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "resolveIssue", null);
__decorate([
    (0, common_1.Get)('processing-jobs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "getProcessingJobs", null);
__decorate([
    (0, common_1.Post)('processing-jobs/run'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "runProcessingJob", null);
__decorate([
    (0, common_1.Get)('seasons-coverage'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "getSeasonsCoverage", null);
__decorate([
    (0, common_1.Get)('versions'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DataManagerController.prototype, "getAuditLogs", null);
exports.DataManagerController = DataManagerController = __decorate([
    (0, common_1.Controller)('data-manager'),
    __metadata("design:paramtypes", [data_manager_service_1.DataManagerService,
        jwt_1.JwtService])
], DataManagerController);
//# sourceMappingURL=data-manager.controller.js.map