import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'seasons', schema: 'public' })
export class Season {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;
}
