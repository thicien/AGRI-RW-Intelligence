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
exports.IrrigationController = void 0;
const common_1 = require("@nestjs/common");
const irrigation_service_1 = require("./irrigation.service");
let IrrigationController = class IrrigationController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSummary(season) {
        return this.service.getSummary(season || '2026B');
    }
    async getDistricts(season) {
        return this.service.getDistricts(season || '2026B');
    }
    async getSeasons() {
        return this.service.getSeasons();
    }
    async getOpportunityScreening(season) {
        return this.service.getOpportunityScreening(season || '2026B');
    }
    async getSchemes() {
        return this.service.getSchemes();
    }
    async getSiteDossier(district, season) {
        const d = district || 'Bugesera';
        const s = season || '2026B';
        return this.service.getSiteDossier(d, s);
    }
    async getPotentialLegacy(season) {
        return this.service.getOpportunityScreening(season || '2026B');
    }
    async getAssetsLegacy() {
        return this.service.getSchemes();
    }
};
exports.IrrigationController = IrrigationController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('districts'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getDistricts", null);
__decorate([
    (0, common_1.Get)('seasons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getSeasons", null);
__decorate([
    (0, common_1.Get)('opportunity-screening'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getOpportunityScreening", null);
__decorate([
    (0, common_1.Get)('schemes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getSchemes", null);
__decorate([
    (0, common_1.Get)('site-dossier'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getSiteDossier", null);
__decorate([
    (0, common_1.Get)('potential'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getPotentialLegacy", null);
__decorate([
    (0, common_1.Get)('assets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getAssetsLegacy", null);
exports.IrrigationController = IrrigationController = __decorate([
    (0, common_1.Controller)('irrigation'),
    __metadata("design:paramtypes", [irrigation_service_1.IrrigationService])
], IrrigationController);
//# sourceMappingURL=irrigation.controller.js.map