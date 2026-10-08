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
exports.Cell = void 0;
const typeorm_1 = require("typeorm");
const sector_entity_1 = require("./sector.entity");
const village_entity_1 = require("./village.entity");
let Cell = class Cell {
    id;
    name;
    sector;
    sector_id;
    geometry;
    villages;
};
exports.Cell = Cell;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Cell.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Cell.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sector_entity_1.Sector, (sector) => sector.cells),
    (0, typeorm_1.JoinColumn)({ name: 'sector_id' }),
    __metadata("design:type", sector_entity_1.Sector)
], Cell.prototype, "sector", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sector_id' }),
    __metadata("design:type", Number)
], Cell.prototype, "sector_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'geometry',
        spatialFeatureType: 'Polygon',
        srid: 4326,
        nullable: true,
    }),
    __metadata("design:type", String)
], Cell.prototype, "geometry", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => village_entity_1.Village, (village) => village.cell),
    __metadata("design:type", Array)
], Cell.prototype, "villages", void 0);
exports.Cell = Cell = __decorate([
    (0, typeorm_1.Entity)('cells')
], Cell);
//# sourceMappingURL=cell.entity.js.map