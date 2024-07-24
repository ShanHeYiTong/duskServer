// src/file/file.module.ts
import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileEntity } from "./entities/file.entity";

@Module({
  providers: [FileService],
  controllers: [FileController],
  imports: [ TypeOrmModule.forFeature([FileEntity]), ],
})
export class FileModule {}
