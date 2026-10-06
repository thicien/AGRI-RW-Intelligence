"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CropStatisticsModule = void 0;
const common_1 = require("@nestjs/common");
const crop_statistics_controller_1 = require("./crop-statistics.controller");
const crop_statistics_service_1 = require("./crop-statistics.service");
let CropStatisticsModule = class CropStatisticsModule {
};
exports.CropStatisticsModule = CropStatisticsModule;
exports.CropStatisticsModule = CropStatisticsModule = __decorate([
    (0, common_1.Module)({
        controllers: [crop_statistics_controller_1.CropStatisticsController],
        providers: [crop_statistics_service_1.CropStatisticsService]
    })
], CropStatisticsModule);
//# sourceMappingURL=crop-statistics.module.js.map