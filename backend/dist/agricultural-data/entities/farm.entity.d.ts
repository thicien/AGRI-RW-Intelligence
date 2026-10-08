import { Village } from '../../administrative-units/entities/village.entity';
import { FarmCrop } from './farm-crop.entity';
export declare class Farm {
    id: number;
    name: string;
    village: Village;
    village_id: number;
    geometry: string;
    area_hectares: number;
    farmCrops: FarmCrop[];
}
