import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule, JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { AuthService } from "../auth/auth.service";
import { JwtStrategy } from "../global/strategy/jwt.strategy";


@Module({
  providers: [UserService,AuthService,JwtService,JwtStrategy],
  controllers: [UserController],
  imports: [ TypeOrmModule.forFeature([User]),
            JwtModule, // Import JwtModule
  ],
})
export class UserModule {}
