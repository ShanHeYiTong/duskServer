// src/file/file.service.ts
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { exec } from 'child_process';
import * as fs from 'fs';
import { InjectRepository } from "@nestjs/typeorm";
import { FileEntity } from "./entities/file.entity";
import { Repository } from "typeorm";
import * as path from 'path';
import { Readable } from 'stream';


@Injectable()
export class FileService {

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}
//1
  // async convertMp4ToMp3(filePath: string): Promise<string> {
  //   const outputFilePath = filePath.replace('.mp4', '.mp3');
  //   const command = `ffmpeg -i ${filePath} -q:a 0 -map a ${outputFilePath}`;
  //
  //   return new Promise((resolve, reject) => {
  //     exec(command, (error, stdout, stderr) => {
  //       if (error) {
  //         console.error(`Error converting file: ${stderr}`);
  //         return reject(error);
  //       }
  //       resolve(outputFilePath);
  //     });
  //   });
  // }

  // async saveMp3ToDatabase(filePath: string): Promise<FileEntity> {
  //   const data = fs.readFileSync(filePath);
  //   const fileEntity = new FileEntity();
  //   fileEntity.data = data;
  //   fileEntity.filename = filePath;
  //   return this.fileRepository.save(fileEntity);
  // }

  /**
   * C:\Users\kland\Downloads\抖音视频下载\泛舟湖上.mp4
   * ffmpeg -i "C:\Users\kland\Downloads\抖音视频下载\泛舟湖上.mp4" -q:a 0 -map a "C:\Users\kland\Downloads\抖音视频下载\泛舟湖上.mp3"
   */

  //2
  async convertMp4ToMp3(filePath: string): Promise<string> {
    console.log("方法开始执行");
    const outputFilePath = filePath.replace('.mp4', '.mp3');
    const command = `ffmpeg -i "${path.resolve(filePath)}" -q:a 0 -map a "${path.resolve(outputFilePath)}"`;
    console.log("命令行");
    console.log(command);
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.log("执行出错");
          console.log(stderr);
          console.error(`Error converting file: ${stderr}`);
          return reject(error);
        }
        resolve(outputFilePath);
      });
    });
  }


  async saveMp3ToDatabase(name:string,filePath: string): Promise<FileEntity> {
    console.log("save方法开始执行");
    const data = fs.readFileSync(filePath);
    if (!data || !filePath) {
      throw new Error('Invalid data or filePath');
    }
    const fileEntity = new FileEntity();
    fileEntity.data = data;
    // fileEntity.filename = path.basename(filePath);
    fileEntity.filename = name;
    console.log(fileEntity);

    return this.fileRepository.save(fileEntity);
  }

  // async saveMp3ToDatabase(filePath: string): Promise<Buffer> {
    // return new Promise((resolve, reject) => {
    //   fs.readFile(filePath, (err, data) => {
    //     if (err) {
    //       return reject(err);
    //     }
    //     resolve(data);
    //   });
    // });
  // }

  //查询单个
  async getFileById(id: number): Promise<FileEntity> {
    return this.fileRepository.findOne({ where: { id } });
  }

  //查询全部
  async getFileByAll(page:number,limit:number){
//     let sql =  `SELECT id, filename 
// FROM file_entity 
// LIMIT ${limit} OFFSET ${(page-1)*limit}`;

let sql = `SELECT id, filename, total_count
FROM (
    SELECT id, filename, COUNT(*) OVER() AS total_count
    FROM file_entity
    LIMIT ${limit} OFFSET ${(page-1)*limit}
) AS subquery`
return await this.fileRepository.query(sql)
  }


}
