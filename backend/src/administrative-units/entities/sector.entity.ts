import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { District } from './district.entity';
import { Cell } from './cell.entity';

@Entity('sectors')
export class Sector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => District, (district) => district.sectors)
  @JoinColumn({ name: 'district_id' })
  district: District;

  @Column({ name: 'district_id' })
  district_id: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  geometry: string;

  @OneToMany(() => Cell, (cell) => cell.sector)
  cells: Cell[];
}
