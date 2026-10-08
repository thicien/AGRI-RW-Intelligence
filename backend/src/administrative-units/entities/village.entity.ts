import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cell } from './cell.entity';

@Entity('villages')
export class Village {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => Cell, (cell) => cell.villages)
  @JoinColumn({ name: 'cell_id' })
  cell: Cell;

  @Column({ name: 'cell_id' })
  cell_id: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  geometry: string;
}
