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
exports.AgriculturalObservation = void 0;
const typeorm_1 = require("typeorm");
const season_entity_1 = require("../../seasons/entities/season.entity");
const crop_entity_1 = require("../../crops/entities/crop.entity");
let AgriculturalObservation = class AgriculturalObservation {
    id;
    year;
    season;
    season_id;
    geography;
    crop;
    crop_id;
    cultivated_area_ha;
    production_mt;
    yield_mt_ha;
    farmer_count;
    source_file;
    imported_at;
};
exports.AgriculturalObservation = AgriculturalObservation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AgriculturalObservation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AgriculturalObservation.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => season_entity_1.Season, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'season_id' }),
    __metadata("design:type", season_entity_1.Season)
], AgriculturalObservation.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'season_id', nullable: true }),
    __metadata("design:type", String)
], AgriculturalObservation.prototype, "season_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AgriculturalObservation.prototype, "geography", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => crop_entity_1.Crop, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'crop_id' }),
    __metadata("design:type", crop_entity_1.Crop)
], AgriculturalObservation.prototype, "crop", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'crop_id', nullable: true }),
    __metadata("design:type", String)
], AgriculturalObservation.prototype, "crop_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], AgriculturalObservation.prototype, "cultivated_area_ha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], AgriculturalObservation.prototype, "production_mt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], AgriculturalObservation.prototype, "yield_mt_ha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], AgriculturalObservation.prototype, "farmer_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AgriculturalObservation.prototype, "source_file", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AgriculturalObservation.prototype, "imported_at", void 0);
exports.AgriculturalObservation = AgriculturalObservation = __decorate([
    (0, typeorm_1.Entity)('agricultural_observations')
], AgriculturalObservation);
//# sourceMappingURL=agricultural-observation.entity.js.map