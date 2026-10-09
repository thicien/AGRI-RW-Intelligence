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
exports.AgriculturalDataController = void 0;
const common_1 = require("@nestjs/common");
const agricultural_data_service_1 = require("./agricultural-data.service");
let AgriculturalDataController = class AgriculturalDataController {
    dataService;
    constructor(dataService) {
        this.dataService = dataService;
    }
    async getObservations(limit = 50, skip = 0) {
        return this.dataService.getObservations(Number(limit), Number(skip));
    }
    async getKpis() {
        return this.dataService.getKpis();
    }
    async getTrends(cropId, seasonId) {
        return this.dataService.getTrends(cropId, seasonId);
    }
    async getSeasonComparison(cropId) {
        return this.dataService.getSeasonComparison(cropId);
    }
    async getGeographicStats(cropId) {
        return this.dataService.getGeographicStats(cropId);
    }
    async getCropStats(id) {
        return this.dataService.getCropStats(id);
    }
    async reseed() {
        await this.dataService.reseed();
        return { success: true, message: 'Database re-seeded with 23 crops' };
    }
    async getMatrix(year, seasonId) {
        return this.dataService.getMatrix(year ? Number(year) : undefined, seasonId);
    }
};
exports.AgriculturalDataController = AgriculturalDataController;
__decorate([
    (0, common_1.Get)('observations'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgriculturalDataController.prototype, "getObservations", null);
__decorate([
    (0, common_1.Get)('kpis'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgriculturalDataController.prototype, "getKpis", null);
__decorate([
    (0, common_1.Get)('trends'),
    __param(0, (0, common_1.Query)('cropId')),
    __param(1, (0, common_1.Query)('seasonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgriculturalDataController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('season-comparison'),
    __param(0, (0, common_1.Query)('cropId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgriculturalDataController.prototype, "getSeasonComparison", null);
__decorate([
    (0, common_1.Get)('geography'),
    __param(0, (0, common_1.Query)('cropId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgriculturalDataController.prototype, "getGeographicStats", null);
__decorate([
    (0, common_1.Get)('crops/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgriculturalDataController.prototype, "getCropStats", null);
__decorate([
    (0, common_1.Get)('reseed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgriculturalDataController.prototype, "reseed", null);
__decorate([
    (0, common_1.Get)('matrix'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('seasonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgriculturalDataController.prototype, "getMatrix", null);
exports.AgriculturalDataController = AgriculturalDataController = __decorate([
    (0, common_1.Controller)('agricultural-data'),
    __metadata("design:paramtypes", [agricultural_data_service_1.AgriculturalDataService])
], AgriculturalDataController);
//# sourceMappingURL=agricultural-data.controller.js.map