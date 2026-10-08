import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Village } from '../../administrative-units/entities/village.entity';
import { FarmCrop } from './farm-crop.entity';

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @ManyToOne(() => Village, { nullable: true })
  @JoinColumn({ name: 'village_id' })
  village: Village;

  @Column({ name: 'village_id', nullable: true })
  village_id: number;

  // The spatial relationship 
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  geometry: string;

  @Column({ type: 'float', nullable: true })
  area_hectares: number;

  @OneToMany(() => FarmCrop, (farmCrop) => farmCrop.farm)
  farmCrops: FarmCrop[];
}
