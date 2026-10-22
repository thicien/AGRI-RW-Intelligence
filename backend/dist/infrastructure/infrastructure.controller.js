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
exports.InfrastructureController = void 0;
const common_1 = require("@nestjs/common");
const infrastructure_service_1 = require("./infrastructure.service");
let InfrastructureController = class InfrastructureController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getFacilities(type, district, search) {
        return this.service.getFacilities({ type, district, search });
    }
    async getFacilityById(id) {
        return this.service.getFacilityById(id);
    }
    async getCapacityAnalysis() {
        return this.service.getCapacityAnalysis();
    }
};
exports.InfrastructureController = InfrastructureController;
__decorate([
    (0, common_1.Get)('facilities'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('district')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InfrastructureController.prototype, "getFacilities", null);
__decorate([
    (0, common_1.Get)('facilities/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InfrastructureController.prototype, "getFacilityById", null);
__decorate([
    (0, common_1.Get)('capacity-analysis'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InfrastructureController.prototype, "getCapacityAnalysis", null);
exports.InfrastructureController = InfrastructureController = __decorate([
    (0, common_1.Controller)('infrastructure'),
    __metadata("design:paramtypes", [infrastructure_service_1.InfrastructureService])
], InfrastructureController);
//# sourceMappingURL=infrastructure.controller.js.map