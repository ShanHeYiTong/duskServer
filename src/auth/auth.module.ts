import { Module } from "@nestjs/common";
import { AuthController } from './auth.controller';
import { LocalStrategy } from "../global/strategy/local.strategy";
import { User } from "../user/entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from './auth.service';
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { ConfigService } from "@nestjs/config";

// const jwtModule = JwtModule.register({
//   secret: 'suibianshenme',
//   signOptions: { expiresIn: '4h' },
// });

const jwtModule = JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET') ?? 'secret',
    signOptions: {
      // expiresIn: configService.get('JWT_EXPIRES_IN') ?? '10m',
    },
  }),
});

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    jwtModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [LocalStrategy, AuthService,UserService],
  exports: [jwtModule],
})
export class AuthModule {}
