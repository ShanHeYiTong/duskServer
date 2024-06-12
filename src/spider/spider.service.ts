import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios from 'axios';
import { HttpService } from '@nestjs/axios';
import * as cheerio from 'cheerio';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Song } from "./entities/song.entity";
import { lastValueFrom } from "rxjs";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class SpiderService {
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
  };

  constructor(
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
    private readonly httpService: HttpService
  ) {}

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

    return 111;
  }


  async findAll(){
    axios.get('https://y.qq.com/n/yqq/toplist/26.html').then(response => {
      const $ = cheerio.load(response.data);
      console.log($);
    });

  }

  //2024-06-11
  private readonly url = 'https://y.qq.com/n/yqq/toplist/26.html';

  async scrapeMusicInfo() {
    try {
      const { data } = await this.makeRequestWithRetries(this.url);
      const $ = cheerio.load(data);

      console.log(data);
      const musicInfoList = [];

      $('.songlist__item').each((index, element) => {
        const songNumber = $(element).find('.songlist__number').text().trim();
        const songName = $(element).find('.songlist__songname_txt a').text().trim();
        const songArtist = $(element).find('.songlist__artist .playlist__author').map((i, el) => $(el).text().trim()).get().join('/');
        const songTime = $(element).find('.songlist__time').text().trim();

        const musicInfo = new Song();
        musicInfo.song_number = parseInt(songNumber, 10);
        musicInfo.song_name = songName;
        musicInfo.artist = songArtist;
        musicInfo.duration = songTime;

        musicInfoList.push(musicInfo);
      });

      // $('.songlist__item').each((index, element) => {
      //   const rank = $(element).find('.songlist__number').text().trim();
      //   const title = $(element).find('.songlist__songname_txt a').text().trim();
      //   const singerName = $(element).find('.songlist__artist .playlist__author').map((i, el) => $(el).text().trim()).get().join('/');
      //   const songId = $(element).find('.songlist__songname_txt a').attr('href').split('/').pop();
      //   const albumMid = $(element).find('.songlist__cover').attr('href').split('/').pop();
      //   const cover = $(element).find('.songlist__pic').attr('src');
      //   const songTime = $(element).find('.songlist__time').text().trim();
      //
      //   const song = new Song();
      //   song.rank = parseInt(rank, 10);
      //   song.title = title;
      //   song.singer_name = singerName;
      //   song.song_id = parseInt(songId, 10);
      //   song.album_mid = albumMid;
      //   song.cover = cover || '';
      //
      //   // 假设其他字段通过其他方式获取，或者默认值
      //   song.rank_type = 0;
      //   song.rank_value = '0';
      //   song.rec_type = 0;
      //   song.vid = '';
      //   song.singer_mid = '';
      //   song.song_type = 0;
      //   song.uuid_cnt = 0;
      //   song.mvid = 0;
      //
      //   musicInfoList.push(song);
      // });

      await this.songRepository.save(musicInfoList);
      return musicInfoList;
    } catch (error) {
      console.error('Error scraping music info:', error);
      throw error;
    }
  }

  private async makeRequestWithRetries(url: string, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }


  //返回播放链接
  async  getPlayUrl(songId: string, guid: string) {
    const vkeyUrl = `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?songmid=${songId}&filename=C400${songId}.m4a&guid=${guid}`;
    const response = await axios.get(vkeyUrl, {
      headers: {
        referer: 'https://y.qq.com/',
        host: 'c.y.qq.com',
      },
    });

    console.log(response);
    const { data } = response;
    const vkey = data.data.items[0].vkey;

    if (!vkey) {
      throw new Error('Failed to get vkey');
    }

    const playUrl = `https://ws.stream.qqmusic.qq.com/C400${songId}.m4a?guid=${guid}&vkey=${vkey}&uin=&fromtag=66`;
    return playUrl;
  }

  //py
  async getMid(songName: string): Promise<string> {
    const url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.top&searchid=58540219608212637&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=10&w=${encodeURIComponent(songName)}&_=1626671326366&cv=4747474&ct=24&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&uin=1248959763&g_tk_new_20200303=1832066374&g_tk=1832066374&hostUin=0&loginUin=0`;
    try {
      const response = await lastValueFrom(this.httpService.get(url, { headers: this.headers }));
      console.log(response.data);
      const mid = response.data.data.song.list[0].mid;
      return mid;
    } catch (error) {
      throw new HttpException('Failed to get song MID', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPurl(mid: string): Promise<string> {
    const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?`;
    const middata = `data={"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":1248959521,"g_tk_new_20200303":1832066374,"g_tk":1832066374},"req_1":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"6846657260","songmid":["${mid}"],"songtype":[0],"uin":"1248959521","loginflag":1,"platform":"20"}}}`;
    try {
      const response = await lastValueFrom(this.httpService.get(`${url}${middata}`, { headers: this.headers }));
      const purl = response.data.req_1.data.midurlinfo[0].purl;
      return purl;
    } catch (error) {
      throw new HttpException('Failed to get song PURL', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async downloadSong(songName: string): Promise<void> {
    const musicUrl = 'https://dl.stream.qqmusic.qq.com/';
    try {
      const mid = await this.getMid(songName);
      const purl = await this.getPurl(mid);
      const response = await lastValueFrom(this.httpService.get(`${musicUrl}${purl}`, { responseType: 'arraybuffer' }));
      const filePath = path.join(__dirname, '../../music', `${songName}.mp3`);
      fs.writeFileSync(filePath, response.data);
      console.log(`${songName} downloaded successfully`);
    } catch (error) {
      throw new HttpException('Failed to download song', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //test
  async test(): Promise<void> {
    // const url = 'https://u6.y.qq.com/cgi-bin/musics.fcg?_=1718163431868&sign=zzb453d2f00lw0ih9dcegywlqqarj83aaf102bb50';
    // const data ='{"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":2094089664,"g_tk_new_20200303":705316568,"g_tk":705316568},"req_1":{"module":"userInfo.VipQueryServer","method":"SRFVipQuery_V2","param":{"uin_list":["2094089664"]}},"req_2":{"module":"userInfo.BaseUserInfoServer","method":"get_user_baseinfo_v2","param":{"vec_uin":["2094089664"]}},"req_3":{"module":"music.lvz.VipIconUiShowSvr","method":"GetVipIconUiV2","param":{"PID":3}},"req_4":{"module":"music.musicasset.SongFavRead","method":"IsSongFanByMid","param":{"v_songMid":["002CQ7e82p2SCl"]}},"req_5":{"module":"music.musichallSong.PlayLyricInfo","method":"GetPlayLyricInfo","param":{"songMID":"002CQ7e82p2SCl","songID":397467}},"req_6":{"method":"GetCommentCount","module":"music.globalComment.GlobalCommentRead","param":{"request_list":[{"biz_type":1,"biz_id":"397467","biz_sub_type":0}]}},"req_7":{"module":"music.musichallAlbum.AlbumInfoServer","method":"GetAlbumDetail","param":{"albumMid":"004fkgLh2f7UY8"}},"req_8":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"1398732880","songmid":["002CQ7e82p2SCl"],"songtype":[0],"uin":"2094089664","loginflag":1,"platform":"20","filename":["RS02062VY0yO1U1Ahy.mp3"]}}}'
    const url = 'https://u6.y.qq.com/cgi-bin/musics.fcg?_=1718173123365&sign=zzb4f7993feoregsftaj9shgcpttnck6gc9a9e5f8';
    const data ='{"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":2094089664,"g_tk_new_20200303":705316568,"g_tk":705316568},"req_1":{"module":"userInfo.VipQueryServer","method":"SRFVipQuery_V2","param":{"uin_list":["2094089664"]}},"req_2":{"module":"userInfo.BaseUserInfoServer","method":"get_user_baseinfo_v2","param":{"vec_uin":["2094089664"]}},"req_3":{"module":"music.lvz.VipIconUiShowSvr","method":"GetVipIconUiV2","param":{"PID":3}},"req_4":{"module":"music.musicasset.SongFavRead","method":"IsSongFanByMid","param":{"v_songMid":["000eXvbv2GXLdW"]}},"req_5":{"module":"music.musichallSong.PlayLyricInfo","method":"GetPlayLyricInfo","param":{"songMID":"000eXvbv2GXLdW","songID":101101628}},"req_6":{"method":"GetCommentCount","module":"music.globalComment.GlobalCommentRead","param":{"request_list":[{"biz_type":1,"biz_id":"101101628","biz_sub_type":0}]}},"req_7":{"module":"music.musichallAlbum.AlbumInfoServer","method":"GetAlbumDetail","param":{"albumMid":"004IWoIx34J0fT"}},"req_8":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"8370941418","songmid":["000eXvbv2GXLdW"],"songtype":[0],"uin":"2094089664","loginflag":1,"platform":"20","filename":["RS020642X9Vg2rEz8s.mp3"]}}}'
    const headers = {
      'cookie': 'pgv_pvid=5009287297; fqm_pvqid=1ce9ea7a-a26d-421d-a165-cd8384e2bf97; ts_uid=3164351716; RK=n7WBv7lDQY; ptcz=574d4f69170d6a3641cbb90ba2926efb56279b12df19166f07efed8444ab3587; music_ignore_pskey=202306271436Hn@vBj; tmeLoginType=2; euin=ownq7enFNKCs7n**; ts_refer=www.google.com/; fqm_sessionid=e60d7a8f-ca50-4a8d-8881-f64993e9151d; pgv_info=ssid=s6398024100; _qpsvr_localtk=0.2837353939996081; login_type=1; psrf_access_token_expiresAt=1725933146; uin=2094089664; wxopenid=; psrf_qqopenid=0F7B56C5A8CDC90683697CCC241816A8; psrf_qqaccess_token=194744D8D1752EE93A76E3C0CF64D057; wxrefresh_token=; psrf_qqrefresh_token=901DBFB0FD372C2019BDD12CD897FE3F; qm_keyst=Q_H_L_63k3NK-zl6an0hh3tdTiYdNUK3KKkjVa4o7ijkaa0SlhBgBYRMQAW8G9diQ16ckw8_2hYGk0gNQ; psrf_musickey_createtime=1718157146; qqmusic_key=Q_H_L_63k3NK-zl6an0hh3tdTiYdNUK3KKkjVa4o7ijkaa0SlhBgBYRMQAW8G9diQ16ckw8_2hYGk0gNQ; psrf_qqunionid=E567258E09FA6AC4D899BD6C46A94BF0; wxunionid=; ts_last=y.qq.com/n/ryqq/player',
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }


   const response =  await axios.post(url, data,{headers: headers});

    console.log(response.data.req_8.data.midurlinfo[0].purl);
    // console.log(response);
    return response.data;
  }
}
