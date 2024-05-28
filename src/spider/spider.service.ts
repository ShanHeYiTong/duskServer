import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class SpiderService {

  async getHotSongs(): Promise<any> {
    const response = await axios.get('https://y.qq.com/n/yqq/toplist/26.html');
    const $ = cheerio.load(response.data);
    const songs: any[] = [];

    $('div.songlist__list li.songlist__item').each((index, element) => {
      const title = $(element).find('div.songlist__songname a').text();
      const singer = $(element).find('div.songlist__artist a').text();
      const album = $(element).find('div.songlist__album a').text();
      const cover = $(element).find('div.songlist__cover img').attr('src');

      songs.push({ title, singer, album, cover });
    });

    return songs;
  }
}
