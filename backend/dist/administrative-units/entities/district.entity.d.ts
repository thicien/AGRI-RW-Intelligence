import { Province } from './province.entity';
import { Sector } from './sector.entity';
export declare class District {
    id: number;
    name: string;
    province: Province;
    province_id: number;
    geometry: string;
    sectors: Sector[];
}
