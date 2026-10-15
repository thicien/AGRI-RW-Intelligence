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
exports.EnvironmentalController = void 0;
const common_1 = require("@nestjs/common");
const environmental_service_1 = require("./environmental.service");
let EnvironmentalController = class EnvironmentalController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSoilFertility() {
        return this.service.getSoilFertility();
    }
    async getConservationPractices(season) {
        return this.service.getConservationPractices(season || '2025A');
    }
    async getSeasonalComparison() {
        return this.service.getSeasonalComparison();
    }
};
exports.EnvironmentalController = EnvironmentalController;
__decorate([
    (0, common_1.Get)('soil-fertility'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EnvironmentalController.prototype, "getSoilFertility", null);
__decorate([
    (0, common_1.Get)('conservation-practices'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EnvironmentalController.prototype, "getConservationPractices", null);
__decorate([
    (0, common_1.Get)('seasonal-comparison'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EnvironmentalController.prototype, "getSeasonalComparison", null);
exports.EnvironmentalController = EnvironmentalController = __decorate([
    (0, common_1.Controller)('environmental'),
    __metadata("design:paramtypes", [environmental_service_1.EnvironmentalService])
], EnvironmentalController);
//# sourceMappingURL=environmental.controller.js.map