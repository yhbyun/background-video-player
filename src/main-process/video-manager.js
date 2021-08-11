import { dialog } from 'electron';
import { sendToMainWindow } from './window-manager';
import status from './status';
import { logManager } from './log-manager';
import { videoSupport } from './ffmpeg-helper';
import VideoServer from './video-server';

let logger = logManager.getLogger('VideoManager');
let httpServer;

export const playVideo = (videoFile) => {
    videoSupport(videoFile)
        .then((checkResult) => {
            if (
                checkResult.videoCodecSupport &&
                checkResult.audioCodecSupport
            ) {
                if (httpServer) {
                    httpServer.killFfmpegCommand();
                }
                let playParams = {};
                playParams.type = 'native';
                playParams.videoSource = 'file://' + videoFile;
                if (status.isRendererReady) {
                    logger.debug('fileSelected=', playParams);
                    sendToMainWindow('fileSelected', playParams);
                } else {
                    ipcMain.once('ipcRendererReady', (event, args) => {
                        logger.debug('fileSelected', playParams);
                        sendToMainWindow('fileSelected', playParams);
                        status.isRendererReady = true;
                    });
                }
            } else {
                if (!httpServer) {
                    httpServer = new VideoServer();
                }
                httpServer.videoSourceInfo = {
                    videoSourcePath: videoFile,
                    checkResult: checkResult,
                };

                httpServer.createServer();
                console.log('createVideoServer success');

                let playParams = {};
                playParams.type = 'stream';
                playParams.videoSource = 'http://127.0.0.1:8888?startTime=0';
                playParams.duration = checkResult.duration;

                if (status.isRendererReady) {
                    logger.debug('fileSelected=', playParams);
                    sendToMainWindow('fileSelected', playParams);
                } else {
                    ipcMain.once('ipcRendererReady', (event, args) => {
                        logger.debug('fileSelected', playParams);
                        sendToMainWindow('fileSelected', playParams);
                        status.isRendererReady = true;
                    });
                }
            }
        })
        .catch((err) => {
            logger.error('video format error', err);
            const options = {
                type: 'info',
                title: 'Error',
                message: 'It is not a video file!',
                buttons: ['OK'],
            };

            dialog.showMessageBox(options, function (index) {
                logger.debug('showMessageBox', index);
            });
        });
};
