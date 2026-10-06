"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgriculturalDataModule = void 0;
const common_1 = require("@nestjs/common");
const agricultural_data_controller_1 = require("./agricultural-data.controller");
const agricultural_data_service_1 = require("./agricultural-data.service");
let AgriculturalDataModule = class AgriculturalDataModule {
};
exports.AgriculturalDataModule = AgriculturalDataModule;
exports.AgriculturalDataModule = AgriculturalDataModule = __decorate([
    (0, common_1.Module)({
        controllers: [agricultural_data_controller_1.AgriculturalDataController],
        providers: [agricultural_data_service_1.AgriculturalDataService]
    })
], AgriculturalDataModule);
//# sourceMappingURL=agricultural-data.module.js.map