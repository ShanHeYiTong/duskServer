import { Injectable, UnauthorizedException } from "@nestjs/common";
import { User } from "../../user/entities/user.entity";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../db/redis/redis.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {		// 这里的 Strategy 必须是 passport-jwt 包中的
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService  // 注意点 ①
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // secretOrKey: 'suibianshenme',
      secretOrKey: configService.get("JWT_SECRET") ?? "secret",
      passReqToCallback: true    // 注意点 ②
    } as StrategyOptions);
  }

  // async validate(payload: User) {
  //   const existUser = await this.userRepository.findOne({
  //     where: { id: payload.id },
  //   });
  //
  //   if (!existUser) throw new UnauthorizedException('token验证失败');
  //
  //   return existUser;
  // }

  async validate(req: Request, payload: User) { // 注意点 ③
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const existUser = await this.userRepository.findOne({
      where: { id: payload.id }
    });
    const cacheToken = await this.redisService.get(`token_${existUser.id}`);
    if (!cacheToken) throw new UnauthorizedException("token已过期");

    if (token !== cacheToken) throw new UnauthorizedException("token不正确");

    if (!existUser) throw new UnauthorizedException("token验证失败");

    await this.redisService.set(
      `token_${existUser.id}`,
      token,
      this.configService.get("JWT_EXPIRES_IN")
    ); // 注意点 ④
    return existUser;
  }


}
