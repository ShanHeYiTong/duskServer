import { SetMetadata } from '@nestjs/common';

//自定义装饰器@Public
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

