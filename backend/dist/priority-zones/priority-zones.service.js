"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityZonesService = void 0;
const common_1 = require("@nestjs/common");
let PriorityZonesService = class PriorityZonesService {
    calculatePriorityZone(params) {
        const weights = {
            productivityGap: 0.20,
            irrigationOpportunity: 0.15,
            soilManagementNeed: 0.20,
            postHarvestGap: 0.15,
            processingOpportunity: 0.15,
            exportOpportunity: 0.15,
        };
        const rawScore = (params.productivityGap * weights.productivityGap) +
            (params.irrigationOpportunity * weights.irrigationOpportunity) +
            (params.soilManagementNeed * weights.soilManagementNeed) +
            (params.postHarvestGap * weights.postHarvestGap) +
            (params.processingOpportunity * weights.processingOpportunity) +
            (params.exportOpportunity * weights.exportOpportunity);
        const priorityScore = Math.round(rawScore);
        let priorityLevel = 'LOW PRIORITY';
        if (priorityScore >= 75)
            priorityLevel = 'HIGH PRIORITY';
        else if (priorityScore >= 50)
            priorityLevel = 'MEDIUM PRIORITY';
        const constraints = [
            { name: 'Soil degradation', score: params.soilManagementNeed },
            { name: 'Irrigation gap', score: params.irrigationOpportunity },
            { name: 'Post-harvest infrastructure', score: params.postHarvestGap },
            { name: 'Productivity gap', score: params.productivityGap }
        ].sort((a, b) => b.score - a.score);
        const opportunities = [
            { name: 'Processing value addition', score: params.processingOpportunity },
            { name: 'Export markets', score: params.exportOpportunity }
        ].sort((a, b) => b.score - a.score);
        const primaryConstraint = constraints[0].name;
        const secondaryConstraint = constraints[1].name;
        const primaryOpportunity = opportunities[0].name;
        const recommendedInterventions = [];
        if (params.soilManagementNeed > 70) {
            recommendedInterventions.push('Promote soil fertility management, terracing, and erosion-control interventions.');
        }
        if (params.irrigationOpportunity > 70) {
            recommendedInterventions.push('Investigate small-scale irrigation potential (check water availability and suitability).');
        }
        if (params.postHarvestGap > 70) {
            recommendedInterventions.push('Investment in collection/storage infrastructure to reduce post-harvest losses.');
        }
        if (params.processingOpportunity > 70) {
            recommendedInterventions.push('Develop local processing and value-addition capacity to absorb surplus production.');
        }
        if (params.exportOpportunity > 70) {
            recommendedInterventions.push('Strengthen market linkages, quality standards, and cold-chain capacity for export.');
        }
        return {
            priorityScore,
            priorityLevel,
            primaryConstraint,
            secondaryConstraint,
            opportunity: primaryOpportunity,
            recommendedInterventions
        };
    }
};
exports.PriorityZonesService = PriorityZonesService;
exports.PriorityZonesService = PriorityZonesService = __decorate([
    (0, common_1.Injectable)()
], PriorityZonesService);
//# sourceMappingURL=priority-zones.service.js.map