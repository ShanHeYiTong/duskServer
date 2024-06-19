import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('song_list')
export class Song_listEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  song_id: number;

  @Column({ length: 255 }) // 根据需要调整长度
  song_mid: string;

  @Column({ length: 255 }) // 根据需要调整长度
  song_name: string;

}
