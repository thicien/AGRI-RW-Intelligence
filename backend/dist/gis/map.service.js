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
exports.MapService = void 0;
const common_1 = require("@nestjs/common");
const priority_zones_service_1 = require("../priority-zones/priority-zones.service");
let MapService = class MapService {
    priorityZonesService;
    constructor(priorityZonesService) {
        this.priorityZonesService = priorityZonesService;
    }
    async getPriorityZonesGeoJson(districtId) {
        const mockScoreParams = {
            productivityGap: 82,
            irrigationOpportunity: 76,
            soilManagementNeed: 88,
            postHarvestGap: 71,
            processingOpportunity: 79,
            exportOpportunity: 84
        };
        const intelligence = this.priorityZonesService.calculatePriorityZone(mockScoreParams);
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        id: 45,
                        name: 'Kayonza Priority Zone',
                        ...intelligence
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [30.45, -1.85],
                                [30.55, -1.85],
                                [30.52, -1.92],
                                [30.42, -1.90],
                                [30.45, -1.85]
                            ]
                        ]
                    }
                }
            ]
        };
    }
    async getIrrigationOpportunitiesGeoJson() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }
    async getFarmsGeoJson(villageId) {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }
};
exports.MapService = MapService;
exports.MapService = MapService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [priority_zones_service_1.PriorityZonesService])
], MapService);
//# sourceMappingURL=map.service.js.map