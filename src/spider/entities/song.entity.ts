import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  singer: string;

  @Column()
  album: string;

  @Column()
  cover: string;
}
