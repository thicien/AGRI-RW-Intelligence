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
exports.Farm = void 0;
const typeorm_1 = require("typeorm");
const village_entity_1 = require("../../administrative-units/entities/village.entity");
const farm_crop_entity_1 = require("./farm-crop.entity");
let Farm = class Farm {
    id;
    name;
    village;
    village_id;
    geometry;
    area_hectares;
    farmCrops;
};
exports.Farm = Farm;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Farm.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Farm.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => village_entity_1.Village, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'village_id' }),
    __metadata("design:type", village_entity_1.Village)
], Farm.prototype, "village", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'village_id', nullable: true }),
    __metadata("design:type", Number)
], Farm.prototype, "village_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'geometry',
        spatialFeatureType: 'Polygon',
        srid: 4326,
        nullable: true,
    }),
    __metadata("design:type", String)
], Farm.prototype, "geometry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Farm.prototype, "area_hectares", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => farm_crop_entity_1.FarmCrop, (farmCrop) => farmCrop.farm),
    __metadata("design:type", Array)
], Farm.prototype, "farmCrops", void 0);
exports.Farm = Farm = __decorate([
    (0, typeorm_1.Entity)('farms')
], Farm);
//# sourceMappingURL=farm.entity.js.map