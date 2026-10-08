import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { District } from './district.entity';

@Entity('provinces')
export class Province {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  geometry: string;

  @OneToMany(() => District, (district) => district.province)
  districts: District[];
}
