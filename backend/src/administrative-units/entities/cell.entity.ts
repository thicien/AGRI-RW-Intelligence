import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Sector } from './sector.entity';
import { Village } from './village.entity';

@Entity('cells')
export class Cell {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => Sector, (sector) => sector.cells)
  @JoinColumn({ name: 'sector_id' })
  sector: Sector;

  @Column({ name: 'sector_id' })
  sector_id: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  geometry: string;

  @OneToMany(() => Village, (village) => village.cell)
  villages: Village[];
}
