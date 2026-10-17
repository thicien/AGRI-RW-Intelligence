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
exports.CropStatisticsController = void 0;
const common_1 = require("@nestjs/common");
const crop_statistics_service_1 = require("./crop-statistics.service");
let CropStatisticsController = class CropStatisticsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSummary(season) {
        return this.service.getSummary(season || '2025A');
    }
    async getDistrictComparisons(crop, season) {
        return this.service.getDistrictComparisons(crop || 'Maize', season || '2025A');
    }
    async getSeasonalComparison(crop, year) {
        return this.service.getSeasonalComparison(crop || 'Maize', parseInt(year || '2025', 10));
    }
    async getMultiYearTrends(crop, district) {
        return this.service.getMultiYearTrends(crop || 'Maize', district);
    }
    async getUnderperformingAreas(season, crop) {
        return this.service.getUnderperformingAreas(season || '2025A', crop || 'Maize');
    }
    async getDistrictInvestigationDossier(district, crop, season) {
        return this.service.getDistrictInvestigationDossier(district || 'RW-05-07', crop || 'Maize', season || '2025A');
    }
    async getCropsMasterList() {
        return this.service.getCropsMasterList();
    }
    async getSeasonsMasterList() {
        return this.service.getSeasonsMasterList();
    }
    async getDataQualityReport() {
        return this.service.getDataQualityReport();
    }
};
exports.CropStatisticsController = CropStatisticsController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('district-comparison'),
    __param(0, (0, common_1.Query)('crop')),
    __param(1, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getDistrictComparisons", null);
__decorate([
    (0, common_1.Get)('seasonal-comparison'),
    __param(0, (0, common_1.Query)('crop')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getSeasonalComparison", null);
__decorate([
    (0, common_1.Get)('historical-trends'),
    __param(0, (0, common_1.Query)('crop')),
    __param(1, (0, common_1.Query)('district')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getMultiYearTrends", null);
__decorate([
    (0, common_1.Get)('underperforming-areas'),
    __param(0, (0, common_1.Query)('season')),
    __param(1, (0, common_1.Query)('crop')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getUnderperformingAreas", null);
__decorate([
    (0, common_1.Get)('district-dossier'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('crop')),
    __param(2, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getDistrictInvestigationDossier", null);
__decorate([
    (0, common_1.Get)('crops'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getCropsMasterList", null);
__decorate([
    (0, common_1.Get)('seasons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getSeasonsMasterList", null);
__decorate([
    (0, common_1.Get)('data-quality'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getDataQualityReport", null);
exports.CropStatisticsController = CropStatisticsController = __decorate([
    (0, common_1.Controller)('crop-statistics'),
    __metadata("design:paramtypes", [crop_statistics_service_1.CropStatisticsService])
], CropStatisticsController);
//# sourceMappingURL=crop-statistics.controller.js.map