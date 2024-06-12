import { Module } from '@nestjs/common';
import { SpiderService } from './spider.service';
import { SpiderController } from "./spider.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Song } from "./entities/song.entity";
import { HttpModule } from "@nestjs/axios";

@Module({
  controllers: [SpiderController],
  providers: [SpiderService],
  imports: [
    TypeOrmModule.forFeature([Song]),
    HttpModule,
  ],
})
export class SpiderModule {}
