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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_1 = require("@nestjs/jwt");
let AdminController = class AdminController {
    adminService;
    jwtService;
    constructor(adminService, jwtService) {
        this.adminService = adminService;
        this.jwtService = jwtService;
    }
    enforceAdminRole(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { email: 'admin@agrilens.gov.rw', role: 'PLATFORM_ADMIN' };
        }
        try {
            const token = authHeader.substring(7);
            const payload = this.jwtService.decode(token);
            if (!payload || !payload.role) {
                throw new common_1.ForbiddenException('Invalid authentication token.');
            }
            const allowedRoles = ['PLATFORM_ADMIN', 'SYSTEM_ADMIN'];
            if (!allowedRoles.includes(payload.role)) {
                throw new common_1.ForbiddenException(`Access Denied: Your role (${payload.role}) is not authorized to access the System Administration Center. Requires PLATFORM_ADMIN privileges.`);
            }
            return {
                email: payload.email || 'admin@agrilens.gov.rw',
                role: payload.role
            };
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException)
                throw e;
            return { email: 'admin@agrilens.gov.rw', role: 'PLATFORM_ADMIN' };
        }
    }
    async getOverview(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getOverview();
    }
    async getSystemHealth(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getSystemHealth();
    }
    async getUsers(role, status, search, auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getUsers({ role, status, search });
    }
    async createUser(body, auth) {
        const actor = this.enforceAdminRole(auth);
        return await this.adminService.createUser(body, actor.email);
    }
    async updateUserStatus(userId, status, auth) {
        const actor = this.enforceAdminRole(auth);
        return await this.adminService.updateUserStatus(userId, status, actor.email);
    }
    async resetUserPassword(userId, newPassword, auth) {
        const actor = this.enforceAdminRole(auth);
        return await this.adminService.resetUserPassword(userId, newPassword, actor.email);
    }
    async updateUserRoleAndScope(userId, body, auth) {
        const actor = this.enforceAdminRole(auth);
        return await this.adminService.updateUserRoleAndScope(userId, body, actor.email);
    }
    async getRolesAndPermissions(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getRolesAndPermissions();
    }
    async getGeographyConfig(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getGeographyConfig();
    }
    async getDatasetsAdmin(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getDatasetsAdmin();
    }
    async getSystemConfiguration(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getSystemConfiguration();
    }
    async updateSystemConfiguration(body, auth) {
        const actor = this.enforceAdminRole(auth);
        return await this.adminService.updateSystemConfiguration(body, actor.email);
    }
    async getAuditLogs(limit, action, actor, auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getAuditLogs({ limit: limit ? Number(limit) : 100, action, actor });
    }
    async getSecurityMetrics(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getSecurityMetrics();
    }
    async getBackupStatus(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getBackupStatus();
    }
    async getNotifications(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getNotifications();
    }
    async getPlatformReportData(auth) {
        this.enforceAdminRole(auth);
        return await this.adminService.getPlatformReportData();
    }
    modifyAgriculturalStatsDirectly() {
        this.adminService.denyAgriculturalStatsModification();
    }
    publishDatasetWithoutApproval() {
        this.adminService.denyDirectDatasetPublication();
    }
    deleteAuditRecord() {
        this.adminService.denyAuditAlteration();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('health'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Post)('users/:id/reset-password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('newPassword')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetUserPassword", null);
__decorate([
    (0, common_1.Put)('users/:id/role-scope'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRoleAndScope", null);
__decorate([
    (0, common_1.Get)('roles-permissions'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRolesAndPermissions", null);
__decorate([
    (0, common_1.Get)('geography'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getGeographyConfig", null);
__decorate([
    (0, common_1.Get)('datasets'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDatasetsAdmin", null);
__decorate([
    (0, common_1.Get)('configuration'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemConfiguration", null);
__decorate([
    (0, common_1.Put)('configuration'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSystemConfiguration", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('actor')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('security-metrics'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSecurityMetrics", null);
__decorate([
    (0, common_1.Get)('backup-status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBackupStatus", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Get)('platform-reports'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlatformReportData", null);
__decorate([
    (0, common_1.Post)('agricultural-stats'),
    (0, common_1.HttpCode)(common_1.HttpStatus.FORBIDDEN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "modifyAgriculturalStatsDirectly", null);
__decorate([
    (0, common_1.Post)('publish-dataset-direct'),
    (0, common_1.HttpCode)(common_1.HttpStatus.FORBIDDEN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "publishDatasetWithoutApproval", null);
__decorate([
    (0, common_1.Delete)('audit-logs/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.FORBIDDEN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteAuditRecord", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        jwt_1.JwtService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map