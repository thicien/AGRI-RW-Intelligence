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
    async getPotential(season) {
        return this.service.getPotential(season || '2025A');
    }
    async getAssets() {
        return this.service.getAssets();
    }
};
exports.IrrigationController = IrrigationController;
__decorate([
    (0, common_1.Get)('potential'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getPotential", null);
__decorate([
    (0, common_1.Get)('assets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IrrigationController.prototype, "getAssets", null);
exports.IrrigationController = IrrigationController = __decorate([
    (0, common_1.Controller)('irrigation'),
    __metadata("design:paramtypes", [irrigation_service_1.IrrigationService])
], IrrigationController);
//# sourceMappingURL=irrigation.controller.js.map