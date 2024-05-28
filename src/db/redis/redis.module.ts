import { Global, Module } from "@nestjs/common";
import { RedisService } from './redis.service';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { redisStore } from "cache-manager-redis-yet";
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from "redis";

@Global() // 这里我们使用@Global 装饰器让这个模块变成全局的
@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
          },
          ttl: configService.get<number>('REDIS_TTL'),
          database: configService.get<number>('REDIS_DB'), //数字索引来标识数据库
          password: configService.get<string>('REDIS_PASSWORD'),
        });
        return {
          store,
        };
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
