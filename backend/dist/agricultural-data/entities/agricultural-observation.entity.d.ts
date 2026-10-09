import { Season } from '../../seasons/entities/season.entity';
import { Crop } from '../../crops/entities/crop.entity';
export declare class AgriculturalObservation {
    id: string;
    year: number;
    season: Season;
    season_id: string;
    geography: string;
    crop: Crop;
    crop_id: string;
    cultivated_area_ha: number;
    production_mt: number;
    yield_mt_ha: number;
    farmer_count: number;
    source_file: string;
    imported_at: Date;
}
