import { Controller, Delete, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { Public } from "../global/decorator/public.decorator";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
@ApiTags('login')
@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Public()
  @Post('login')

  @ApiQuery({ name: 'password', type: String, required: true,
    schema: {
      type: 'string',
      format: 'password', // 使用format属性指定密码格式
    },
    description: '用户密码' })
  @ApiQuery({ name: 'username', type: String, required: true, description: '用户账号' })
  login(@Req() req: any){
    return this.authService.login(req.user);
  }

  @ApiBearerAuth()
  @Delete('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user);
  }

}
