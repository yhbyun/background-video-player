import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);
import http from 'http';

function getParam(url, key) {
    let param = new Object();
    let item = new Array();
    let urlList = url.split('?');
    let req;

    if (urlList.length == 1) {
        req = urlList[0];
    } else {
        req = urlList[1];
    }

    const list = req.split('&');
    for (let i = 0; i < list.length; i++) {
        item = list[i].split('=');
        param[item[0]] = item[1];
    }

    return param[key] ? param[key] : null;
}

export default class VideoServer {
    constructor(props) {
        this._videoServer;
        this._videoSourceInfo;
        this._ffmpegCommand;
    }

    set videoSourceInfo(info) {
        this._videoSourceInfo = info;
    }

    get videoSourceInfo() {
        return this._videoSourceInfo;
    }

    killFfmpegCommand() {
        if (this._ffmpegCommand) {
            this._ffmpegCommand.kill();
        }
    }

    createServer() {
        if (!this._videoServer && this.videoSourceInfo) {
            this._videoServer = http
                .createServer((request, response) => {
                    console.log('on request', request.url);
                    const startTime = parseInt(
                        getParam(request.url, 'startTime')
                    );
                    let videoCodec = this.videoSourceInfo.checkResult
                        .videoCodecSupport
                        ? 'copy'
                        : 'libx264';
                    let audioCodec = this.videoSourceInfo.checkResult
                        .audioCodecSupport
                        ? 'copy'
                        : 'aac';
                    this.killFfmpegCommand();
                    this._ffmpegCommand = ffmpeg()
                        .input(this.videoSourceInfo.videoSourcePath)
                        .nativeFramerate()
                        .videoCodec(videoCodec)
                        .audioCodec(audioCodec)
                        .format('mp4')
                        .seekInput(startTime)
                        .outputOptions(
                            '-movflags',
                            'frag_keyframe+empty_moov+faststart',
                            '-g',
                            '18'
                        )
                        .on('progress', function (progress) {
                            console.log('time: ' + progress.timemark);
                        })
                        .on('error', function (err) {
                            console.log('An error occurred: ' + err.message);
                        })
                        .on('end', function () {
                            console.log('Processing finished !');
                        });
                    let videoStream = this._ffmpegCommand.pipe();
                    videoStream.pipe(response);
                })
                .listen(8888);
        }
    }
}
