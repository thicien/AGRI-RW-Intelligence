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
    async getByCrop(crop, season) {
        return this.service.getByCrop(crop, season || '2025A');
    }
    async getTrends() {
        return this.service.getTrends();
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
    (0, common_1.Get)('by-crop'),
    __param(0, (0, common_1.Query)('crop')),
    __param(1, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getByCrop", null);
__decorate([
    (0, common_1.Get)('trends'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CropStatisticsController.prototype, "getTrends", null);
exports.CropStatisticsController = CropStatisticsController = __decorate([
    (0, common_1.Controller)('crop-statistics'),
    __metadata("design:paramtypes", [crop_statistics_service_1.CropStatisticsService])
], CropStatisticsController);
//# sourceMappingURL=crop-statistics.controller.js.map