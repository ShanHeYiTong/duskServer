import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger, ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./global/filter/http-exception/http-exception.filter";
import { TransformInterceptor } from "./global/interceptor/transform/transform.interceptor";

import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('duskWeb后端项目')
    .setDescription('The cats API description')  //简介
    .setVersion('1.0')
    .addTag('login')
    .addTag('user')
    .addTag('spider')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('doc', app, document);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor()) //注册拦截器
  app.useGlobalFilters(new HttpExceptionFilter()); //注册过虑器
  app.enableCors();//允许跨域
  app.use('/static', express.static(join(__dirname, '..', 'public')));
  let HOST='localhost'
  let PORT='10000'
  await app.listen(PORT, () => {
    Logger.log(`服务已经启动,接口请访问:http://${HOST}:${PORT}`);
  });
}
bootstrap();
