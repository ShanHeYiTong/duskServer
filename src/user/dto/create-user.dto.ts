import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {

  @IsNotEmpty({ message: '用户名不能为空' })
  @ApiProperty({ title:'姓名'})
  username: string;

  @IsNotEmpty()
  @ApiProperty({ title:'密码'})
  password: string;

  @ApiProperty({ title:'创建时间，系统自动处理'})
  created_at: Date;

  @ApiProperty({ title:'修改时间，系统自动处理'})
  updated_at: Date;
}
