import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

//实现读写的方法
@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T> {
    return await this.cacheManager.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    return await this.cacheManager.set(key, value, ttl);
  }

  //删除数据
  async del(key: string): Promise<void> {
    return await this.cacheManager.del(key);
  }

}
