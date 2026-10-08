import { Sector } from './sector.entity';
import { Village } from './village.entity';
export declare class Cell {
    id: number;
    name: string;
    sector: Sector;
    sector_id: number;
    geometry: string;
    villages: Village[];
}
