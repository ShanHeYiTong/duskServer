import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuthService } from "../auth/auth.service";

// @ApiBearerAuth() // 表示使用Bearer Token进行身份验证
// @ApiHeader({
//   name: 'Authorization',
//   description: 'Bearer Token',
// })
// @ApiSecurity('JWT') // 使用JWT认证方式
@ApiBearerAuth()
@ApiTags('user') //指定标签
@Controller('user')
export class UserController {
  constructor(private readonly authService: AuthService,
              private readonly userService: UserService) {}

  // @UseGuards(AuthGuard('local'))
  // // @UseGuards(LocalAuthGuard)
  // @Post('auth/login')
  // async login(@Request() req) {
  //   return this.authService.login(req.user);
  // }
  //
  // @UseGuards(AuthGuard('jwt'))
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
 // docker run -itd --restart=always --name  mysql8.0 -p 3306:3306   mysql:8.0
  // }

  //增
  @Post('create')
  async createApi(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  //单查
  // @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOneeApi(@Param('id') id: number) {
    return this.userService.findOnee(id)
  }

  //分查
  @Get()
  @ApiQuery({ name: 'page', type: Number, required: true, description: '页码' })
  @ApiQuery({ name: 'size', type: Number, required: true, description: '每页数量' })
  async findAllApi(@Query('page') page: number, @Query('size') size: number) {
    return this.userService.findAll({page, size})
  }

  //修改
  @Patch(':id')
  updateApi(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  //删除
  @Delete(':id')
  removeApi(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

}
