import { Injectable } from '@nestjs/common';
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";
@Injectable()
export class UserService {
  private readonly users: User[];

  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,

  ) {}

  //Create 增
  async create(createUserDto: CreateUserDto) {
    const user = new User();
    user.username = createUserDto.username;
    user.password = createUserDto.password;
    return await this.user.save(user);
  }
//查询一条
  async findOnee(id: number) {
    return await this.user.findOne({ where: { id } });
  }

  //分页查询
  async findAll(query: { page: number; size: number }) {
    const { page, size } = query;
    const [users, total] = await this.user.findAndCount({
      skip: (page - 1) * size,
      take: size,
    });
    console.log(total)
    return { users, total };
  }
  //修改
  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
    }
    return await this.user.update(id, updateUserDto);
  }
  //删除
  async remove(id: number) {
    return await this.user.delete(id);
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
