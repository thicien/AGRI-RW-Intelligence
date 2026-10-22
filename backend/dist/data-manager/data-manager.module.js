"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataManagerModule = void 0;
const common_1 = require("@nestjs/common");
const data_manager_controller_1 = require("./data-manager.controller");
const data_manager_service_1 = require("./data-manager.service");
const jwt_1 = require("@nestjs/jwt");
let DataManagerModule = class DataManagerModule {
};
exports.DataManagerModule = DataManagerModule;
exports.DataManagerModule = DataManagerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'agrilens-secret-key-rwanda-2026',
                signOptions: { expiresIn: '24h' },
            }),
        ],
        controllers: [data_manager_controller_1.DataManagerController],
        providers: [data_manager_service_1.DataManagerService],
        exports: [data_manager_service_1.DataManagerService],
    })
], DataManagerModule);
//# sourceMappingURL=data-manager.module.js.map