import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios from "axios";
import { HttpService } from "@nestjs/axios";
import * as cheerio from "cheerio";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Song } from "./entities/song.entity";
import { lastValueFrom } from "rxjs";
import * as path from "path";
import * as fs from "fs";
import * as crypto from 'crypto';
import { Song_listEntity } from "./entities/song_list.entity";
import * as qrcode from 'qrcode';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SpiderService {
  private readonly headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
  };

  constructor(
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
    @InjectRepository(Song_listEntity)
    private songListEntityRepository: Repository<Song_listEntity>,
    private readonly httpService: HttpService
  ) {
  }

  //获取音乐列表
  async getMusicList(): Promise<any> {
    return await this.songRepository.find();
  }

  async getHotSongs(): Promise<any> {
    const response = await axios.get("https://y.qq.com/n/yqq/toplist/26.html");
    const $ = cheerio.load(response.data);
    const songs: any[] = [];

    $("div.songlist__list li.songlist__item").each((index, element) => {
      const title = $(element).find("div.songlist__songname a").text();
      const singer = $(element).find("div.songlist__artist a").text();
      const album = $(element).find("div.songlist__album a").text();
      const cover = $(element).find("div.songlist__cover img").attr("src");

      songs.push({ title, singer, album, cover });
    });

    return 111;
  }
  async findAll() {
    axios.get("https://y.qq.com/n/yqq/toplist/26.html").then(response => {
      const $ = cheerio.load(response.data);
      console.log($);
    });

  }

  //2024-06-11
  private readonly url = "https://y.qq.com/n/yqq/toplist/26.html";

  async scrapeMusicInfo() {
    try {
      const { data } = await this.makeRequestWithRetries(this.url);
      const $ = cheerio.load(data);

      console.log(data);
      const musicInfoList = [];

      $(".songlist__item").each((index, element) => {
        const songNumber = $(element).find(".songlist__number").text().trim();
        const songName = $(element).find(".songlist__songname_txt a").text().trim();
        const songArtist = $(element).find(".songlist__artist .playlist__author").map((i, el) => $(el).text().trim()).get().join("/");
        const songTime = $(element).find(".songlist__time").text().trim();

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
      console.error("Error scraping music info:", error);
      throw error;
    }
  }

  private async makeRequestWithRetries(url: string, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
          }
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
  async getPlayUrl(songId: string, guid: string) {
    const vkeyUrl = `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?songmid=${songId}&filename=C400${songId}.m4a&guid=${guid}`;
    const response = await axios.get(vkeyUrl, {
      headers: {
        referer: "https://y.qq.com/",
        host: "c.y.qq.com"
      }
    });

    console.log(response);
    const { data } = response;
    const vkey = data.data.items[0].vkey;

    if (!vkey) {
      throw new Error("Failed to get vkey");
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
      throw new HttpException("Failed to get song MID", HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException("Failed to get song PURL", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async downloadSong(songName: string): Promise<void> {
    const musicUrl = "https://dl.stream.qqmusic.qq.com/";
    try {
      const mid = await this.getMid(songName);
      const purl = await this.getPurl(mid);
      const response = await lastValueFrom(this.httpService.get(`${musicUrl}${purl}`, { responseType: "arraybuffer" }));
      const filePath = path.join(__dirname, "../../music", `${songName}.mp3`);
      fs.writeFileSync(filePath, response.data);
      console.log(`${songName} downloaded successfully`);
    } catch (error) {
      throw new HttpException("Failed to download song", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  //获取歌手作品列表
  async getArtistWorks(songName: string): Promise<any> {
    const url = "https://u6.y.qq.com/cgi-bin/musics.fcg?_=1718331025446&sign=zzb1bd22978bjhv3r5h9a4m8xrggphw2cc12a98";
    const data = `{"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":1900543145,"g_tk_new_20200303":1309760157,"g_tk":1309760157},"req_1":{"method":"DoSearchForQQMusicDesktop","module":"music.search.SearchCgiService","param":{"remoteplace":"txt.yqq.center","searchid":"54968859815650649","search_type":0,"query":"${songName}","page_num":1,"num_per_page":10}}}`;
    const headers = {
      'cookie': 'pgv_pvid=8570772280; RK=K8dcL5Xxfl; ptcz=b5b6200910da789e21fee1231f9a104fab9146af59327658078fdc2ab84f0207; tvfe_boss_uuid=5a502cf68fc23247; fqm_pvqid=48fca49d-32bb-4441-bd59-974e7a1a63c4; o_cookie=1900543145; pac_uid=1_1900543145; ied_qq=o1900543145; eas_sid=x1V6l8d8B7M2s9K3x06566i8x2; iip=0; _qimei_uuid42=1850a0d3a39100385824a50db33a6a7d80d371c60e; _qimei_fingerprint=cbc7204554f888483c8c3ece04fac816; _qimei_q36=; _qimei_h38=fded18ca5824a50db33a6a7d0200000351850a; suid=1_1900543145; current-city-name=bj; fqm_sessionid=a0613629-b4d9-4e06-bc1f-f5342cc18279; pgv_info=ssid=s1047078130; ts_uid=1418586046; ts_refer=www.bing.com/; _qpsvr_localtk=0.5094977930646372; login_type=1; wxopenid=; tmeLoginType=2; wxunionid=; euin=oKEzoe4Poi6P7v**; psrf_qqrefresh_token=C6255D57DA0C7EF6CB4C10AC21E526F0; qqmusic_key=Q_H_L_63k3Nn8INGEBecuveWIWlHDW51EDDuFeWtm3WuBVSBJaK76hDRswKzemIST0w0-rqISNikR-ROQ; psrf_musickey_createtime=1718351165; psrf_qqunionid=2358A7332A7B4E7AAE82DF1725DEA47A; psrf_qqaccess_token=F59CB8E12DD097F31A2BD5C0C6CAC573; wxrefresh_token=; psrf_access_token_expiresAt=1726127165; music_ignore_pskey=202306271436Hn@vBj; qm_keyst=Q_H_L_63k3Nn8INGEBecuveWIWlHDW51EDDuFeWtm3WuBVSBJaK76hDRswKzemIST0w0-rqISNikR-ROQ; uin=1900543145; psrf_qqopenid=5CD0E3D1993EB3D75660CCCE77CE49A1; ts_last=y.qq.com/n/ryqq/index.html',
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }


    const response =  await axios.post(url, data,{headers: headers});

    //输出歌手下歌曲列表
    const renamedItems = response.data.req_1.data.body.zhida.list[1].track_list.items.map(item => ({
      song_id: item.id,
      song_mid: item.mid,
      song_name: item.name,
      // 添加更多字段重命名
    }));
    //保存到song_list表
    await this.songListEntityRepository.save(renamedItems);

    return response.data.req_1.data.body.zhida.list[1].track_list.items;
  }

  //test
  async test( ): Promise<string> {
    // const url = 'https://u6.y.qq.com/cgi-bin/musics.fcg?_=1718163431868&sign=zzb453d2f00lw0ih9dcegywlqqarj83aaf102bb50';
    // const data ='{"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":2094089664,"g_tk_new_20200303":705316568,"g_tk":705316568},"req_1":{"module":"userInfo.VipQueryServer","method":"SRFVipQuery_V2","param":{"uin_list":["2094089664"]}},"req_2":{"module":"userInfo.BaseUserInfoServer","method":"get_user_baseinfo_v2","param":{"vec_uin":["2094089664"]}},"req_3":{"module":"music.lvz.VipIconUiShowSvr","method":"GetVipIconUiV2","param":{"PID":3}},"req_4":{"module":"music.musicasset.SongFavRead","method":"IsSongFanByMid","param":{"v_songMid":["002CQ7e82p2SCl"]}},"req_5":{"module":"music.musichallSong.PlayLyricInfo","method":"GetPlayLyricInfo","param":{"songMID":"002CQ7e82p2SCl","songID":397467}},"req_6":{"method":"GetCommentCount","module":"music.globalComment.GlobalCommentRead","param":{"request_list":[{"biz_type":1,"biz_id":"397467","biz_sub_type":0}]}},"req_7":{"module":"music.musichallAlbum.AlbumInfoServer","method":"GetAlbumDetail","param":{"albumMid":"004fkgLh2f7UY8"}},"req_8":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"1398732880","songmid":["002CQ7e82p2SCl"],"songtype":[0],"uin":"2094089664","loginflag":1,"platform":"20","filename":["RS02062VY0yO1U1Ahy.mp3"]}}}'
    // const url = "https://u6.y.qq.com/cgi-bin/musics.fcg?_=1718173123365&sign=zzb4f7993feoregsftaj9shgcpttnck6gc9a9e5f8";
    //获取歌曲列表
    // const testUrl = "https://u6.y.qq.com/cgi-bin/musics.fcg?_=1718331025446&sign=zzb1bd22978bjhv3r5h9a4m8xrggphw2cc12a98";
    // const data = `{"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":2094089664,"g_tk_new_20200303":1309760157,"g_tk":1309760157},"req_1":{"method":"DoSearchForQQMusicDesktop","module":"music.search.SearchCgiService","param":{"remoteplace":"txt.yqq.center","searchid":"54968859815650649","search_type":0,"query":"${songName}","page_num":1,"num_per_page":10}}}`;

    //获取歌曲链接
    // const testUrl = "https://u6.y.qq.com/cgi-bin/musics.fcg?_=1718350611616&sign=zzbae3b51c67mc4ltdnrxfduercvfnvzw6ed4a1d9"; //zzbiaww648ea5k7f867dabea0dd0d0e829922b6c88a3ea6
    const testUrl = "https://u6.y.qq.com/cgi-bin/musics.fcg?_=1718350611616&sign=zzbiaww648ea5k7f867dabea0dd0d0e829922b6c88a3ea6";
    const data = `{"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":2094089664,"g_tk_new_20200303":1309760157,"g_tk":1309760157},"req_1":{"module":"music.musichallSong.PlayLyricInfo","method":"GetPlayLyricInfo","param":{"songMID":"002Mu8Y03KLEjY","songID":465608024}},"req_2":{"method":"GetCommentCount","module":"music.globalComment.GlobalCommentRead","param":{"request_list":[{"biz_type":1,"biz_id":"465608024","biz_sub_type":0}]}},"req_3":{"module":"music.musichallAlbum.AlbumInfoServer","method":"GetAlbumDetail","param":{"albumMid":"000v9LOL2ezYMP"}},"req_4":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"1624032469","songmid":["002Mu8Y03KLEjY"],"songtype":[0],"uin":"2094089664","loginflag":1,"platform":"20","filename":["RS02062kckq73HqYIn.mp3"]}}}`;

    const headers = {
      'cookie': 'pgv_pvid=5009287297; fqm_pvqid=1ce9ea7a-a26d-421d-a165-cd8384e2bf97; ts_uid=3164351716; RK=n7WBv7lDQY; ptcz=574d4f69170d6a3641cbb90ba2926efb56279b12df19166f07efed8444ab3587; music_ignore_pskey=202306271436Hn@vBj; tmeLoginType=2; euin=ownq7enFNKCs7n**; ts_refer=www.google.com/; fqm_sessionid=7bd101bc-b6de-4627-859b-7a6d4493d566; pgv_info=ssid=s6715945230; _qpsvr_localtk=0.9001792699888931; login_type=1; psrf_qqunionid=E567258E09FA6AC4D899BD6C46A94BF0; qm_keyst=Q_H_L_63k3NFwZfxtrztJtPt43fWojd_GcCZbiBEUc974MQ-vdEcojLXFXYkarRTpglCoXbU6gCBaz7sQ; psrf_access_token_expiresAt=1726107009; psrf_qqaccess_token=194744D8D1752EE93A76E3C0CF64D057; uin=2094089664; psrf_qqrefresh_token=901DBFB0FD372C2019BDD12CD897FE3F; psrf_musickey_createtime=1718331009; psrf_qqopenid=0F7B56C5A8CDC90683697CCC241816A8; wxopenid=; wxrefresh_token=; wxunionid=; qqmusic_key=Q_H_L_63k3NFwZfxtrztJtPt43fWojd_GcCZbiBEUc974MQ-vdEcojLXFXYkarRTpglCoXbU6gCBaz7sQ; ts_last=y.qq.com/n/ryqq/player',
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }


    const response =  await axios.post(testUrl, data,{headers: headers});

    //输出歌曲链接
     console.log(response.data.req_8.data.midurlinfo[0].purl);

     return response.data.req_8.data.midurlinfo[0].purl
    // return this.getSign(data); //zzby0xd3a8no86hmafffbcd50eb744946b9fea13a8353542
  }

  //MD5加密
  private readonly encNonce = '001zuulu0mtWly';
  private readonly signPrefix = 'zzb';
  private readonly dir = '0234567890abcdefghijklmnopqrstuvwxyz';

  getSign(encParams: string): string {
    const randomStr = this.uuidGenerate();
    const md5Hash = this.convertToMd5(this.encNonce + encParams);
    return this.signPrefix + randomStr + md5Hash;
  }

  private uuidGenerate(): string {
    const minLen = 10;
    const maxLen = 16;
    const ranLen = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
    let result = '';
    for (let i = 0; i < ranLen; i++) {
      result += this.dir.charAt(Math.floor(Math.random() * this.dir.length));
    }
    return result;
  }

  convertToMd5(plainText: string): string {
    try {
      const secretBytes = crypto.createHash('md5').update(plainText, 'utf8').digest('hex');
      let md5code = secretBytes;
      for (let i = 0; i < 32 - md5code.length; i++) {
        md5code = '0' + md5code;
      }
      return md5code;
    } catch (error) {
      throw new Error('没有这个md5算法！');
    }
  }

  // md5(input: string): string {
  //   const buffer = Buffer.from(input);
  //   const hash = crypto.createHash('md5').update(buffer).digest('hex');
  //   console.log(hash);
  //   return hash;
  // }

  md5Hash(input: string): string {
    return this.md5HashFunction(this.convertStringToByteArray(input));
  }

  private md5HashFunction(input: number[]): string {
    const blockSize = 16;
    const words: number[] = [];
    let a = 1732584193,
      b = -271733879,
      c = -1732584194,
      d = 271733878;

    function F(x: number, y: number, z: number): number {
      return (x & y) | (~x & z);
    }

    function G(x: number, y: number, z: number): number {
      return (x & z) | (y & ~z);
    }

    function H(x: number, y: number, z: number): number {
      return x ^ y ^ z;
    }

    function I(x: number, y: number, z: number): number {
      return y ^ (x | ~z);
    }

    function rotateLeft(x: number, n: number): number {
      return (x << n) | (x >>> (32 - n));
    }

    for (let i = 0; i < input.length; i += blockSize) {
      let oldA = a;
      let oldB = b;
      let oldC = c;
      let oldD = d;

      for (let j = 0; j < 64; j++) {
        let index = i + j;
        let f: number, g: number;

        if (j < 16) {
          f = F(b, c, d);
          g = j;
        } else if (j < 32) {
          f = G(b, c, d);
          g = (5 * j + 1) % 16;
        } else if (j < 48) {
          f = H(b, c, d);
          g = (3 * j + 5) % 16;
        } else {
          f = I(b, c, d);
          g = (7 * j) % 16;
        }

        const temp = d;
        d = c;
        c = b;
        b = b + rotateLeft((a + f + input[index] + this.k(j)), this.s(j));
        a = temp;
      }

      a += oldA;
      b += oldB;
      c += oldC;
      d += oldD;
    }

    const md5Hash = this.wordToHex(a) + this.wordToHex(b) + this.wordToHex(c) + this.wordToHex(d);
    console.log(md5Hash);
    return md5Hash;
  }

  private convertStringToByteArray(input: string): number[] {
    const byteArray: number[] = [];
    for (let i = 0; i < input.length * 8; i += 8) {
      byteArray[i >> 5] |= (input.charCodeAt(i / 8) & 255) << (i % 32);
    }
    return byteArray;
  }

  private k(index: number): number {
    return Math.floor(Math.abs(Math.sin(index + 1)) * 4294967296);
  }

  private s(index: number): number {
    const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22];
    return s[index];
  }

  private wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i < 4; i++) {
      hex += (value >> (i * 8)) & 255;
    }
    return hex;
  }

  //扫描二维码登录
  private users = {};
  private userId = 1;
  async generateQRCode(): Promise<{ code: string; userId: number }> {
    this.users[this.userId] = {
      token: null,
      time: Date.now(),
    };
    const code = await qrcode.toDataURL(`http://localhost:3000/static/mandate.html?userId=${this.userId}`);
    return {
      code,
      userId: this.userId,
    };
  }

  generateToken(userId: number): { token: string } {
    const token = jwt.sign({ userId }, 'secret');
    this.users[userId].token = token;
    this.users[userId].time = Date.now();
    return { token };
  }

  checkStatus(userId: number): { status: number } {
    const user = this.users[userId];
    if (!user) {
      return { status: 0 };
    }
    if (Date.now() - user.time > 1000 * 60 * 1) {
      return { status: 2 };
    } else if (user.token) {
      return { status: 1 };
    } else {
      return { status: 0 };
    }
  }
}
