import { Injectable } from '@nestjs/common';
import { PriorityZonesService } from '../priority-zones/priority-zones.service';

@Injectable()
export class MapService {
  constructor(private priorityZonesService: PriorityZonesService) {}

  async getPriorityZonesGeoJson(districtId?: number) {
    // In a full implementation, this would query PostGIS for district geometries
    // and join with the agricultural statistics to generate dynamic scores.
    // Here we simulate the Level 4 Intelligence output based on the architecture.

    const mockScoreParams = {
      productivityGap: 82,
      irrigationOpportunity: 76,
      soilManagementNeed: 88,
      postHarvestGap: 71,
      processingOpportunity: 79,
      exportOpportunity: 84
    };

    const intelligence = this.priorityZonesService.calculatePriorityZone(mockScoreParams);

    // Return the FeatureCollection expected by React
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

  async getFarmsGeoJson(villageId?: number) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}
