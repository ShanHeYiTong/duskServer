import { Injectable } from '@nestjs/common';
import { User } from "../user/entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "../db/redis/redis.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private redisService: RedisService,
    private jwtService: JwtService) {}

  async login(user: Partial<User>) {
    const payload = { username: user.username, id: user.id };

    const access_token = this.jwtService.sign(payload);

    //向redis存入token
    await this.redisService.set(
      `token_${user.id}`,
      access_token,
      this.configService.get('JWT_EXPIRES_IN'), // 注意这里
    );

    return {
      access_token,
      type: 'Bearer',
    };
  }


  async logout(user: Partial<User>) {
    await this.redisService.del(`token_${user.id}`);
  }
}
