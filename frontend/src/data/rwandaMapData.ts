import rawGeoJSON from './rwandaDistricts.json';

export interface DistrictCentroid {
  lng: number;
  lat: number;
}

export const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  Gicumbi: [30.12, -1.61],
  Nyaruguru: [29.54, -2.71],
  Rubavu: [29.33, -1.67],
  Ngororero: [29.62, -1.86],
  Nyamagabe: [29.47, -2.39],
  Karongi: [29.38, -2.14],
  Gakenke: [29.78, -1.69],
  Bugesera: [30.25, -2.23],
  Kayonza: [30.65, -1.85],
  Rutsiro: [29.35, -1.93],
  Nyagatare: [30.33, -1.30],
  Kirehe: [30.73, -2.27],
  Gatsibo: [30.45, -1.60],
  Rwamagana: [30.43, -1.95],
  Musanze: [29.63, -1.50],
  Burera: [29.83, -1.45],
  Rulindo: [29.98, -1.73],
  Huye: [29.70, -2.60],
  Nyanza: [29.75, -2.35],
  Ruhango: [29.78, -2.22],
  Muhanga: [29.75, -2.08],
  Kamonyi: [29.93, -2.00],
  Gisagara: [29.84, -2.61],
  Rusizi: [28.90, -2.58],
  Nyamasheke: [29.15, -2.35],
  Gasabo: [30.13, -1.90],
  Kicukiro: [30.10, -2.00],
  Nyarugenge: [30.05, -1.96],
  Nyabihu: [29.50, -1.65],
  Gakenke_alt: [29.78, -1.69],
};

export const RWANDA_DISTRICTS_GEOJSON = rawGeoJSON as any;

export type PerformanceTier = 'HIGH' | 'MODERATE' | 'LOW' | 'NO_DATA';

export interface DistrictChoroplethData {
  districtName: string;
  numericValue: number | null;
  value?: number | null;
  formattedValue: string;
  tier: PerformanceTier;
  tierLabel: string;
  color: string;
  rank?: number;
  hasData: boolean;
  facilitiesCount?: number;
  additionalInfo?: Record<string, any>;
}

export function enrichRwandaGeoJSON(
  districtDataMap: Record<string, DistrictChoroplethData>,
  defaultColor = '#CBD5E1'
) {
  const cloned = JSON.parse(JSON.stringify(RWANDA_DISTRICTS_GEOJSON));
  
  cloned.features = cloned.features.map((feature: any) => {
    const shapeName = feature.properties?.shapeName || '';
    const match = districtDataMap[shapeName] || districtDataMap[shapeName.toLowerCase()] || Object.values(districtDataMap).find(
      d => d.districtName.toLowerCase() === shapeName.toLowerCase()
    );

    if (match) {
      feature.properties = {
        ...feature.properties,
        districtName: match.districtName,
        numericValue: match.numericValue,
        formattedValue: match.formattedValue,
        tier: match.tier,
        tierLabel: match.tierLabel,
        choroplethColor: match.color,
        rank: match.rank || null,
        hasData: match.hasData,
        facilitiesCount: match.facilitiesCount || 0,
      };
    } else {
      feature.properties = {
        ...feature.properties,
        districtName: shapeName,
        numericValue: null,
        formattedValue: 'No Data Recorded',
        tier: 'NO_DATA',
        tierLabel: 'Unreported',
        choroplethColor: defaultColor,
        rank: null,
        hasData: false,
        facilitiesCount: 0,
      };
    }
    return feature;
  });

  return cloned;
}
