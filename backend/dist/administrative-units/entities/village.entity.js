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
exports.Village = void 0;
const typeorm_1 = require("typeorm");
const cell_entity_1 = require("./cell.entity");
let Village = class Village {
    id;
    name;
    cell;
    cell_id;
    geometry;
};
exports.Village = Village;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Village.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Village.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cell_entity_1.Cell, (cell) => cell.villages),
    (0, typeorm_1.JoinColumn)({ name: 'cell_id' }),
    __metadata("design:type", cell_entity_1.Cell)
], Village.prototype, "cell", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cell_id' }),
    __metadata("design:type", Number)
], Village.prototype, "cell_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'geometry',
        spatialFeatureType: 'Polygon',
        srid: 4326,
        nullable: true,
    }),
    __metadata("design:type", String)
], Village.prototype, "geometry", void 0);
exports.Village = Village = __decorate([
    (0, typeorm_1.Entity)('villages')
], Village);
//# sourceMappingURL=village.entity.js.map