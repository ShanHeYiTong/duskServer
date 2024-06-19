import { Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { SpiderService } from "./spider.service";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

@ApiTags('spider') //指定标签
@Controller('spider')
export class SpiderController {
  constructor(private readonly spiderService: SpiderService) {}


  //回去音乐列表
  @ApiOperation({
    summary: '获取音乐列表',
  })
  @Get('list')
  async getMusicList() {
    return  await this.spiderService.getMusicList();
  }


  // @Get('one')
  // getHello()   {
  //   return this.spiderService.getHotSongs();
  // }


  // @Get('two')
  // async findAll() {
  //   return this.spiderService.findAll();
  // }

  @ApiOperation({
    summary: '爬取歌手的作品',
  })
  @Get('artistWorks')
  async getArtistWorks(@Query('songName') songName: string) {
    return this.spiderService.getArtistWorks(songName);
  }

  //20024-6-11
  @ApiOperation({
    summary: '抓取qq音乐歌曲信息',
    // description: 'status=0 表示未启动, status=1 表示启动。'
  })
  @Get('scrape')
  async scrapeMusic() {
    const musicInfo = await this.spiderService.scrapeMusicInfo();
    return musicInfo;
  }
  //20024-6-11 返回播放链接
  @ApiOperation({
    summary: '返回播放链接',
  })
  @Get('play')
  @ApiQuery({ name: 'songId', type: Number, description: '任务ID' })
  async getPlayUrl(@Query('songId') songId: string,@Query('guid') guid: string) {
    const playUrl = await this.spiderService.getPlayUrl(songId,guid);
    return playUrl;
  }
//py
  @ApiOperation({
    summary: 'py下载歌曲',
  })
  @Get('download')
  async downloadSong(@Query('songName') songName: string): Promise<string> {
    await this.spiderService.downloadSong(songName);
    return `${songName} downloaded successfully`;
  }
  //c测试接口
  @ApiOperation({
    summary: '测试接口',
  })
  @Get('test')
  async test() {
    return this.spiderService.test();
  }

//扫描二维码登录

  //生成二维码
  @Get('qrcode')
  async generateQRCode(@Res() res) {
    const result = await this.spiderService.generateQRCode();
    res.json(result);
  }

  //登录
  @Post('login/:userId')
  generateToken(@Param('userId') userId: string, @Res() res) {
    const result = this.spiderService.generateToken(Number(userId));
    res.json(result);
  }

  //检查登录状态
  @Get('check/:userId')
  checkStatus(@Param('userId') userId: string, @Res() res) {
    const result = this.spiderService.checkStatus(Number(userId));
    res.json(result);
  }
}
