<template>
    <div id="app">
        <div id="holder" ref="holder">
            <div id="video-container" ref="videoContainer" />
        </div>
    </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './StreamPlayTech';

function getWindowSize() {
    const { offsetWidth, offsetHeight } = document.documentElement
    const { innerHeight } = window // innerHeight will be blank in Windows system
    return [
        offsetWidth,
        innerHeight > offsetHeight ? offsetHeight : innerHeight
    ]
}

function createVideoHtml(source, poster) {
    const [width, height] = getWindowSize()
    const videoHtml =
        `<video id="my-video" class="video-js vjs-big-play-centered" controls preload="auto" width="${width}"
    height="${height}" poster="${poster}" data-setup="{}">
    <source src="${source}" type="video/mp4">
    <p class="vjs-no-js">
    To view this video please enable JavaScript, and consider upgrading to a web browser that
    <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
    </p>
    </video>`
    return videoHtml;
}

export default {
    name: 'app',
    mounted () {
        let holder = this.$refs.holder;
        let videoContainer = this.$refs.videoContainer;
        let videoHtml = createVideoHtml('https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4', 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg')
        videoContainer.innerHTML = videoHtml;

        holder.ondragover = function () {
            return false;
        };

        holder.ondragleave = holder.ondragend = function () {
            return false;
        };

        holder.ondrop = function (e) {
            e.preventDefault();
            var file = e.dataTransfer.files[0];
            console.log('File you dragged here is', file.path);
            ipcRenderer.send('fileDrop', file.path);
            return false;
        };

        let vid = document.getElementById("my-video");

        let player = videojs(vid);

        document.onkeydown = (event) => {
            console.log("onkeypress", event);
            if (event.code === "Space") {
                if (player) {
                    if (player.paused()) {
                        player.play();
                    } else {
                        player.pause();
                    }
                }
                return false;
            }
        }

        ipcRenderer.on('play-control', (event, message) => {
            if (message === 'play') {
                player.play();
            } else if (message === 'pause') {
                player.pause();
            }
        })

        ipcRenderer.on('fileSelected', (event, message) => {
            console.log('fileSelected:', message)
            let vid = document.getElementById("my-video");
            videojs(vid).dispose();

            videoContainer.innerHTML = createVideoHtml(message.videoSource, '');
            vid = document.getElementById('my-video');
            if (message.type === 'native') {
                player = videojs(vid);
                player.play();
            } else if (message.type === 'stream') {
                player = videojs(vid, {
                    techOrder: ['StreamPlay'],
                    StreamPlay: { duration: message.duration }
                }, () => {
                    player.play()
                });
            }
        });

        ipcRenderer.send('ipcRendererReady', 'true');
    },
}
</script>

<style>
html,
body {
    padding: 0;
    margin: 0;
    overflow: hidden;
}

#video-container,
#my-video {
    width: 100vw;
    height: 100vh;
}
</style>
