import { Farm } from './farm.entity';
import { Crop } from '../../crops/entities/crop.entity';
import { Season } from '../../seasons/entities/season.entity';
export declare class FarmCrop {
    id: number;
    farm: Farm;
    farm_id: number;
    crop: Crop;
    crop_id: number;
    season: Season;
    season_id: number;
    area_hectares: number;
    yield: number;
}
