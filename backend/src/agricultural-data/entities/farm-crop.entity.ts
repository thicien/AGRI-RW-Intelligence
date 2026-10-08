import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Farm } from './farm.entity';
import { Crop } from '../../crops/entities/crop.entity';
import { Season } from '../../seasons/entities/season.entity';

@Entity('farm_crops')
export class FarmCrop {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Farm, (farm) => farm.farmCrops)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farm_id: number;

  @ManyToOne(() => Crop)
  @JoinColumn({ name: 'crop_id' })
  crop: Crop;

  @Column({ name: 'crop_id' })
  crop_id: number;

  @ManyToOne(() => Season)
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @Column({ name: 'season_id', nullable: true })
  season_id: number;

  @Column({ type: 'float', nullable: true })
  area_hectares: number;

  @Column({ type: 'float', nullable: true })
  yield: number;
}
