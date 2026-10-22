"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistrictModule = void 0;
const common_1 = require("@nestjs/common");
const district_controller_1 = require("./district.controller");
const district_service_1 = require("./district.service");
const jwt_1 = require("@nestjs/jwt");
let DistrictModule = class DistrictModule {
};
exports.DistrictModule = DistrictModule;
exports.DistrictModule = DistrictModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'agrilens_rwanda_super_secure_jwt_secret_key_2026',
                signOptions: { expiresIn: '12h' },
            }),
        ],
        controllers: [district_controller_1.DistrictController],
        providers: [district_service_1.DistrictService],
        exports: [district_service_1.DistrictService],
    })
], DistrictModule);
//# sourceMappingURL=district.module.js.map