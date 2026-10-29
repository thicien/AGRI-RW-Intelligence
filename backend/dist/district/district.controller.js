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
exports.DistrictController = void 0;
const common_1 = require("@nestjs/common");
const district_service_1 = require("./district.service");
const jwt_1 = require("@nestjs/jwt");
let DistrictController = class DistrictController {
    districtService;
    jwtService;
    constructor(districtService, jwtService) {
        this.districtService = districtService;
        this.jwtService = jwtService;
    }
    resolveAuthorizedDistrict(authHeader, requestedDistrict) {
        let tokenDistrict = null;
        let userRole = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const payload = this.jwtService.decode(token);
                if (payload) {
                    userRole = payload.role;
                    tokenDistrict = payload.district || null;
                }
            }
            catch (e) {
            }
        }
        if (userRole === 'DISTRICT_OFFICER') {
            if (!tokenDistrict) {
                throw new common_1.ForbiddenException('User token does not contain an assigned district scope.');
            }
            if (requestedDistrict && requestedDistrict.trim().toLowerCase() !== tokenDistrict.trim().toLowerCase()) {
                throw new common_1.ForbiddenException(`Geographic Access Restriction: You are authorized for ${tokenDistrict} District only. Access to ${requestedDistrict} data is strictly prohibited.`);
            }
            return tokenDistrict;
        }
        return requestedDistrict?.trim() || tokenDistrict || 'Musanze';
    }
    async getOverview(district, season, year, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        return await this.districtService.getDistrictOverview(verifiedDistrict, season || '2026B', year);
    }
    async getProductivity(district, season, compareSeason, compareMode, stabilityThreshold, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        return await this.districtService.getDistrictProductivity(verifiedDistrict, season || '2026B', compareSeason, compareMode, stabilityThreshold ? parseFloat(stabilityThreshold) : 5.0);
    }
    async getIrrigation(district, season, compareSeason, compareMode, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        return await this.districtService.getDistrictIrrigation(verifiedDistrict, season || '2026B', compareSeason, compareMode);
    }
    async getSoil(district, season, compareSeason, compareMode, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        return await this.districtService.getDistrictSoil(verifiedDistrict, season || '2026B', compareSeason, compareMode);
    }
    async getPostHarvest(district, season, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        return await this.districtService.getDistrictPostHarvest(verifiedDistrict, season || '2026B');
    }
    async getExports(district, season, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        return await this.districtService.getDistrictExports(verifiedDistrict, season || '2026B');
    }
    async getInterventions(district, status, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        return await this.districtService.getDistrictInterventions(verifiedDistrict, status);
    }
    async updateInterventionStatus(id, body) {
        return await this.districtService.updateInterventionStatus(id, body.status, body.notes, body.userEmail);
    }
    async submitFieldObservation(body, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, body.districtName);
        return await this.districtService.submitFieldObservation({
            ...body,
            districtName: verifiedDistrict
        });
    }
    async getReports(district, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        const overview = await this.districtService.getDistrictOverview(verifiedDistrict);
        return {
            reportTitle: `AgriLens Rwanda — District Agricultural Intelligence Brief (${verifiedDistrict})`,
            district: verifiedDistrict,
            publishedBy: 'National Institute of Statistics of Rwanda (NISR) & MINAGRI',
            generatedAt: new Date().toISOString(),
            classification: 'OFFICIAL DISTRICT ANALYTICAL DOSSIER',
            overviewKpis: overview.kpis,
            sectorHighlights: overview.sectors.slice(0, 5),
            interventionsSummary: overview.interventions,
            disclaimer: 'This document contains authorized district-scoped intelligence derived from verified NISR seasonal agricultural surveys.'
        };
    }
    async getNotifications(district, auth) {
        const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
        return [
            {
                id: 'notif-1',
                title: 'NISR Season 2026B Validation Data Released',
                message: `Preliminary crop cutting and yield metrics for ${verifiedDistrict} District are now integrated into your dashboard.`,
                date: '2 hours ago',
                type: 'DATA_RELEASE',
                priority: 'HIGH'
            },
            {
                id: 'notif-2',
                title: 'Pending Field Verification Request',
                message: `New sector agronomist submission in ${verifiedDistrict} requires district officer sign-off.`,
                date: '1 day ago',
                type: 'FIELD_ACTION',
                priority: 'MEDIUM'
            },
            {
                id: 'notif-3',
                title: 'Small-Scale Irrigation Subsidy Window Open',
                message: `MINAGRI SSIT subsidy allocations have been designated for eligible marshland sites in ${verifiedDistrict}.`,
                date: '3 days ago',
                type: 'POLICY',
                priority: 'NORMAL'
            }
        ];
    }
};
exports.DistrictController = DistrictController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('productivity'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __param(2, (0, common_1.Query)('compareSeason')),
    __param(3, (0, common_1.Query)('compareMode')),
    __param(4, (0, common_1.Query)('stabilityThreshold')),
    __param(5, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getProductivity", null);
__decorate([
    (0, common_1.Get)('irrigation'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __param(2, (0, common_1.Query)('compareSeason')),
    __param(3, (0, common_1.Query)('compareMode')),
    __param(4, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getIrrigation", null);
__decorate([
    (0, common_1.Get)('soil'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __param(2, (0, common_1.Query)('compareSeason')),
    __param(3, (0, common_1.Query)('compareMode')),
    __param(4, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getSoil", null);
__decorate([
    (0, common_1.Get)('post-harvest'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getPostHarvest", null);
__decorate([
    (0, common_1.Get)('exports'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getExports", null);
__decorate([
    (0, common_1.Get)('interventions'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getInterventions", null);
__decorate([
    (0, common_1.Put)('interventions/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "updateInterventionStatus", null);
__decorate([
    (0, common_1.Post)('field-observations'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "submitFieldObservation", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DistrictController.prototype, "getNotifications", null);
exports.DistrictController = DistrictController = __decorate([
    (0, common_1.Controller)('district'),
    __metadata("design:paramtypes", [district_service_1.DistrictService,
        jwt_1.JwtService])
], DistrictController);
//# sourceMappingURL=district.controller.js.map