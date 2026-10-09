import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface PriorityScoreParams {
  productivityGap: number;     // 0-100
  irrigationOpportunity: number; // 0-100
  soilManagementNeed: number;    // 0-100
  postHarvestGap: number;        // 0-100
  processingOpportunity: number; // 0-100
  exportOpportunity: number;     // 0-100
}

export interface PriorityZoneResult {
  priorityScore: number; // 0-100
  priorityLevel: 'LOW PRIORITY' | 'MEDIUM PRIORITY' | 'HIGH PRIORITY';
  primaryConstraint: string;
  secondaryConstraint: string;
  opportunity: string;
  recommendedInterventions: string[];
}

@Injectable()
export class PriorityZonesService {
  
  /**
   * Calculates the overall agricultural priority score for a geographic region
   * based on the 5 pillars of the AgriLens intelligence pipeline.
   * 
   * @param params Scores for each of the agricultural pillars
   * @returns PriorityZoneResult containing the final score and recommendations
   */
  calculatePriorityZone(params: PriorityScoreParams): PriorityZoneResult {
    // 1. Calculate weighted overall score
    // These weights can be adjusted based on MINAGRI/PSTA5 strategic priorities
    const weights = {
      productivityGap: 0.20,
      irrigationOpportunity: 0.15,
      soilManagementNeed: 0.20,
      postHarvestGap: 0.15,
      processingOpportunity: 0.15,
      exportOpportunity: 0.15,
    };

    const rawScore = 
      (params.productivityGap * weights.productivityGap) +
      (params.irrigationOpportunity * weights.irrigationOpportunity) +
      (params.soilManagementNeed * weights.soilManagementNeed) +
      (params.postHarvestGap * weights.postHarvestGap) +
      (params.processingOpportunity * weights.processingOpportunity) +
      (params.exportOpportunity * weights.exportOpportunity);

    const priorityScore = Math.round(rawScore);

    // 2. Determine Priority Level
    let priorityLevel: 'LOW PRIORITY' | 'MEDIUM PRIORITY' | 'HIGH PRIORITY' = 'LOW PRIORITY';
    if (priorityScore >= 75) priorityLevel = 'HIGH PRIORITY';
    else if (priorityScore >= 50) priorityLevel = 'MEDIUM PRIORITY';

    // 3. Identify Constraints and Opportunities
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

    // 4. Generate Evidence-Based Interventions
    const recommendedInterventions: string[] = [];
    
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

  // Future method to pull raw facts (Level 1) from NISR datasets
  // calculateIndicators() -> Level 2
  // detectGaps() -> Level 3
  // generateDecisions() -> Level 4
}
