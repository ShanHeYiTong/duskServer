import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import * as bcrypt from 'bcrypt';


@Entity("user")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // @Column({ name: 'account', unique: true })
  @Column()
  username:string;

  // 不读取password字段  select: false
  @Column({ select: false })     // 增加了 select: false
  password:string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // 功能是在数据插入数据库前执行一个函数
  @BeforeInsert()
  async hashPassword() {
    if (this.password) this.password = bcrypt.hashSync(this.password, 10);
  }

  constructor() {
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

