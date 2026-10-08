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
exports.District = void 0;
const typeorm_1 = require("typeorm");
const province_entity_1 = require("./province.entity");
const sector_entity_1 = require("./sector.entity");
let District = class District {
    id;
    name;
    province;
    province_id;
    geometry;
    sectors;
};
exports.District = District;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], District.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], District.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => province_entity_1.Province, (province) => province.districts),
    (0, typeorm_1.JoinColumn)({ name: 'province_id' }),
    __metadata("design:type", province_entity_1.Province)
], District.prototype, "province", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'province_id' }),
    __metadata("design:type", Number)
], District.prototype, "province_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'geometry',
        spatialFeatureType: 'Polygon',
        srid: 4326,
        nullable: true,
    }),
    __metadata("design:type", String)
], District.prototype, "geometry", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sector_entity_1.Sector, (sector) => sector.district),
    __metadata("design:type", Array)
], District.prototype, "sectors", void 0);
exports.District = District = __decorate([
    (0, typeorm_1.Entity)('districts')
], District);
//# sourceMappingURL=district.entity.js.map