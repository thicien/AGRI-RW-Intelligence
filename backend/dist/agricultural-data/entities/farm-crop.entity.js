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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarmCrop = void 0;
const typeorm_1 = require("typeorm");
const farm_entity_1 = require("./farm.entity");
const crop_entity_1 = require("../../crops/entities/crop.entity");
const season_entity_1 = require("../../seasons/entities/season.entity");
let FarmCrop = class FarmCrop {
    id;
    farm;
    farm_id;
    crop;
    crop_id;
    season;
    season_id;
    area_hectares;
    yield;
};
exports.FarmCrop = FarmCrop;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FarmCrop.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => farm_entity_1.Farm, (farm) => farm.farmCrops),
    (0, typeorm_1.JoinColumn)({ name: 'farm_id' }),
    __metadata("design:type", farm_entity_1.Farm)
], FarmCrop.prototype, "farm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'farm_id' }),
    __metadata("design:type", Number)
], FarmCrop.prototype, "farm_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => crop_entity_1.Crop),
    (0, typeorm_1.JoinColumn)({ name: 'crop_id' }),
    __metadata("design:type", crop_entity_1.Crop)
], FarmCrop.prototype, "crop", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'crop_id' }),
    __metadata("design:type", Number)
], FarmCrop.prototype, "crop_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => season_entity_1.Season),
    (0, typeorm_1.JoinColumn)({ name: 'season_id' }),
    __metadata("design:type", season_entity_1.Season)
], FarmCrop.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'season_id', nullable: true }),
    __metadata("design:type", Number)
], FarmCrop.prototype, "season_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], FarmCrop.prototype, "area_hectares", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], FarmCrop.prototype, "yield", void 0);
exports.FarmCrop = FarmCrop = __decorate([
    (0, typeorm_1.Entity)('farm_crops')
], FarmCrop);
//# sourceMappingURL=farm-crop.entity.js.map