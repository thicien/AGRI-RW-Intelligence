import { District } from './district.entity';
import { Cell } from './cell.entity';
export declare class Sector {
    id: number;
    name: string;
    district: District;
    district_id: number;
    geometry: string;
    cells: Cell[];
}
