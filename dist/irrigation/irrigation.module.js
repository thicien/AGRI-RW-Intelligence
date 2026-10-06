"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IrrigationModule = void 0;
const common_1 = require("@nestjs/common");
const irrigation_controller_1 = require("./irrigation.controller");
const irrigation_service_1 = require("./irrigation.service");
let IrrigationModule = class IrrigationModule {
};
exports.IrrigationModule = IrrigationModule;
exports.IrrigationModule = IrrigationModule = __decorate([
    (0, common_1.Module)({
        controllers: [irrigation_controller_1.IrrigationController],
        providers: [irrigation_service_1.IrrigationService]
    })
], IrrigationModule);
//# sourceMappingURL=irrigation.module.js.map