"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClimateModule = void 0;
const common_1 = require("@nestjs/common");
const climate_controller_1 = require("./climate.controller");
const climate_service_1 = require("./climate.service");
let ClimateModule = class ClimateModule {
};
exports.ClimateModule = ClimateModule;
exports.ClimateModule = ClimateModule = __decorate([
    (0, common_1.Module)({
        controllers: [climate_controller_1.ClimateController],
        providers: [climate_service_1.ClimateService]
    })
], ClimateModule);
//# sourceMappingURL=climate.module.js.map