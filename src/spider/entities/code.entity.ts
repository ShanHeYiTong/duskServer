import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('codes')
export class QrCode  {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  uuid: string;

  @Column()
  status: string;

  @Column()
  createdAt: Date;
}
