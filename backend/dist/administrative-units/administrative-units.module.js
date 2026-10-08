"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdministrativeUnitsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const administrative_units_controller_1 = require("./administrative-units.controller");
const administrative_units_service_1 = require("./administrative-units.service");
const province_entity_1 = require("./entities/province.entity");
const district_entity_1 = require("./entities/district.entity");
const sector_entity_1 = require("./entities/sector.entity");
const cell_entity_1 = require("./entities/cell.entity");
const village_entity_1 = require("./entities/village.entity");
let AdministrativeUnitsModule = class AdministrativeUnitsModule {
};
exports.AdministrativeUnitsModule = AdministrativeUnitsModule;
exports.AdministrativeUnitsModule = AdministrativeUnitsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([province_entity_1.Province, district_entity_1.District, sector_entity_1.Sector, cell_entity_1.Cell, village_entity_1.Village])],
        controllers: [administrative_units_controller_1.AdministrativeUnitsController],
        providers: [administrative_units_service_1.AdministrativeUnitsService],
        exports: [administrative_units_service_1.AdministrativeUnitsService]
    })
], AdministrativeUnitsModule);
//# sourceMappingURL=administrative-units.module.js.map