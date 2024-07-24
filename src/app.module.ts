import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpiderModule } from './spider/spider.module';
import { AuthModule } from "./auth/auth.module";
import envConfig from "../config/envConfig";
import { RedisModule } from "./db/redis/redis.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UserModule } from "./user/user.module";
import { HashService } from './hash/hash.service';
import { FileModule } from "./file/file.module";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get<string>("DB_HOST") ?? "localhost",
        port: configService.get<number>("DB_PORT") ?? 3306,
        username: configService.get<string>("DB_USERNAME") ?? "root",
        password: configService.get<string>("DB_PASSWORD") ?? "root",
        database: configService.get<string>("DB_DATABASE") ?? "project-test01",
        synchronize: false,
        retryDelay: 500,
        retryAttempts: 10,
        autoLoadEntities: true
      })
    }),
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [envConfig.path]
    }),
    RedisModule,
    UserModule,
    SpiderModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService, HashService],
})
export class AppModule {}
