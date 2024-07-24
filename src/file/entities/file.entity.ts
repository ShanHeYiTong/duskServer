// src/file/file.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // @Column({ type: 'bytea' })
  @Column({ type: 'longblob', nullable: false })
  data: Buffer;

  @Column({ nullable: false })
  filename: string;
}
