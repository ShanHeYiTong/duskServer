import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  song_number: number;

  @Column({ nullable: true })
  song_name: string;

  @Column()
  artist: string;

  @Column()
  duration: string;

  @Column()
  url: string;
}
