"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ingestion_controller_1 = require("./ingestion.controller");
const ingestion_service_1 = require("./ingestion.service");
const crop_entity_1 = require("../crops/entities/crop.entity");
const season_entity_1 = require("../seasons/entities/season.entity");
const farm_crop_entity_1 = require("../agricultural-data/entities/farm-crop.entity");
const farm_entity_1 = require("../agricultural-data/entities/farm.entity");
const village_entity_1 = require("../administrative-units/entities/village.entity");
const agricultural_observation_entity_1 = require("../agricultural-data/entities/agricultural-observation.entity");
let IngestionModule = class IngestionModule {
};
exports.IngestionModule = IngestionModule;
exports.IngestionModule = IngestionModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([crop_entity_1.Crop, season_entity_1.Season, farm_crop_entity_1.FarmCrop, farm_entity_1.Farm, village_entity_1.Village, agricultural_observation_entity_1.AgriculturalObservation])],
        controllers: [ingestion_controller_1.IngestionController],
        providers: [ingestion_service_1.IngestionService],
    })
], IngestionModule);
//# sourceMappingURL=ingestion.module.js.map