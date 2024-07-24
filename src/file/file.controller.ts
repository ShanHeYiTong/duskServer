// src/file/file.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, Query } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { Response } from 'express';
import * as iconv from 'iconv-lite';
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";

@ApiTags('上传文件')
// 上传文件控制器
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}



  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  // @ts-ignore
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // async uploadFile(@UploadedFile() file: any) {
  console.log( "进入方法")
// 将文件名转换为 UTF-8 编码
const originalName = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf-8');

//  // 查找第一个空格的位置并进行截取
//  const firstSpaceIndex = originalName.indexOf('听');
// 查找 '》' 符号的位置并进行替换
 let newName = originalName;

//  if (firstSpaceIndex !== -1) {
//   // 截取第一个空格之前的部分并去掉
//   newName = originalName.substring(firstSpaceIndex + 2);
// }

 const index = originalName.indexOf('》');
 if (index !== -1) {
   newName = originalName.substring(0, index + 1) + '.mp3';
 }
console.log(originalName)
console.log(newName)
  
    const mp3FilePath = await this.fileService.convertMp4ToMp3(file.path);
    console.log(mp3FilePath);
    const mp3Data = await this.fileService.saveMp3ToDatabase(newName,mp3FilePath);
    console.log(mp3Data);
    // 在这里你可以将mp3Data保存到数据库
    return "转换成功";
  }


  @Get(':id')
  async getFile(@Param('id') id: number, @Res() res: Response) {
    const fileEntity = await this.fileService.getFileById(id);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(fileEntity.data);
  }



  @Get('list/all')
  async getFileAll(@Query('page') page: number,@Query('limit') limit: number) {
    return await this.fileService.getFileByAll(page,limit);
  }


  
}
