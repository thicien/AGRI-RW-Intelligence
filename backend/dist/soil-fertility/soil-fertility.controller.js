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
exports.SoilFertilityController = void 0;
const common_1 = require("@nestjs/common");
const soil_fertility_service_1 = require("./soil-fertility.service");
let SoilFertilityController = class SoilFertilityController {
    soilFertilityService;
    constructor(soilFertilityService) {
        this.soilFertilityService = soilFertilityService;
    }
    async getSummary(season = '2026B') {
        return this.soilFertilityService.getSummary(season);
    }
    async getDistricts(season = '2026B') {
        return this.soilFertilityService.getDistricts(season);
    }
    async getSeasons() {
        return this.soilFertilityService.getSeasons();
    }
    async getPriorityRanking(season = '2026B') {
        return this.soilFertilityService.getPriorityRanking(season);
    }
    async getProjects() {
        return this.soilFertilityService.getProjects();
    }
    async getHistoricalCorrelation(district = 'Gicumbi') {
        return this.soilFertilityService.getHistoricalCorrelation(district);
    }
    async getSiteDossier(district = 'Gicumbi', season = '2026B') {
        return this.soilFertilityService.getSiteDossier(district, season);
    }
};
exports.SoilFertilityController = SoilFertilityController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SoilFertilityController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('districts'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SoilFertilityController.prototype, "getDistricts", null);
__decorate([
    (0, common_1.Get)('seasons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SoilFertilityController.prototype, "getSeasons", null);
__decorate([
    (0, common_1.Get)('priority-ranking'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SoilFertilityController.prototype, "getPriorityRanking", null);
__decorate([
    (0, common_1.Get)('projects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SoilFertilityController.prototype, "getProjects", null);
__decorate([
    (0, common_1.Get)('correlation'),
    __param(0, (0, common_1.Query)('district')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SoilFertilityController.prototype, "getHistoricalCorrelation", null);
__decorate([
    (0, common_1.Get)('site-dossier'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SoilFertilityController.prototype, "getSiteDossier", null);
exports.SoilFertilityController = SoilFertilityController = __decorate([
    (0, common_1.Controller)('soil-fertility'),
    __metadata("design:paramtypes", [soil_fertility_service_1.SoilFertilityService])
], SoilFertilityController);
//# sourceMappingURL=soil-fertility.controller.js.map