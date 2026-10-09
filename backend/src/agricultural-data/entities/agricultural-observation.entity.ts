import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Season } from '../../seasons/entities/season.entity';
import { Crop } from '../../crops/entities/crop.entity';

@Entity('agricultural_observations')
export class AgriculturalObservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  year: number;

  @ManyToOne(() => Season, { nullable: true })
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @Column({ name: 'season_id', nullable: true })
  season_id: string;

  @Column()
  geography: string; // District or Province name

  @ManyToOne(() => Crop, { nullable: true })
  @JoinColumn({ name: 'crop_id' })
  crop: Crop;

  @Column({ name: 'crop_id', nullable: true })
  crop_id: string;

  @Column({ type: 'float', nullable: true })
  cultivated_area_ha: number;

  @Column({ type: 'float', nullable: true })
  production_mt: number;

  @Column({ type: 'float', nullable: true })
  yield_mt_ha: number;

  @Column({ type: 'int', nullable: true })
  farmer_count: number;

  @Column({ nullable: true })
  source_file: string;

  @CreateDateColumn()
  imported_at: Date;
}
