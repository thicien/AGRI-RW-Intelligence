import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'crops', schema: 'public' })
export class Crop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
