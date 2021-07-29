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
import 'videojs-youtube';
import './StreamPlayTech';
import path from 'path';

/* global __static */

function getWindowSize() {
    const { offsetWidth, offsetHeight } = document.documentElement
    const { innerHeight } = window // innerHeight will be blank in Windows system
    return [
        offsetWidth,
        innerHeight > offsetHeight ? offsetHeight : innerHeight
    ]
}

function createVideoHtml(source, poster, type) {
    const [width, height] = getWindowSize()
    const videoHtml =
        `<video id="my-video" class="video-js vjs-big-play-centered" controls preload="auto" width="${width}"
    height="${height}" poster="${poster}" data-setup="{}">`
        + (type !== 'youtube' ? `<source src="${source}" type="video/mp4">` : '' )
        +
    `<p class="vjs-no-js">
    To view this video please enable JavaScript, and consider upgrading to a web browser that
    <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
    </p>
    </video>`
    return videoHtml;
}

function isLoading() {
    return document.body.classList.contains('loading');
}

function createElement(tag, initialClass = null, style = null) {
    let elem = document.createElement(tag);
    if (initialClass && initialClass.trim().length > 0)
        elem.classList.add(initialClass);
    if (style) {
        Object.keys(style).forEach(key => {
            elem.style[key] = style[key];
        });
    }
    return elem;
}

// TODO: This is what is causing this issue lol
function animateLoader(service) {
    let img = createElement('img', null, service.style);
    img.setAttribute('id', service.name);
    img.setAttribute('src', 'file://' + path.join(__static, service.logo));
    img.setAttribute('alt', service.name);

    // create loader element
    let loader = createElement('div', 'loader');

    // create ripple element
    let ripple = createElement('div', 'ripple', {
        backgroundColor: service.color
    });

    // append ripple and (a clone of) img to loader
    loader.appendChild(ripple);
    loader.appendChild(img);

    document.body.appendChild(loader);

    // set global state to loading
    document.body.classList.add('loading');
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
        });

        ipcRenderer.on('openFile', (event, message) => {
            ipcRenderer.send('fileDrop', message);
        });

        ipcRenderer.on('fileSelected', (event, message) => {
            console.log('fileSelected:', message)
            let vid = document.getElementById("my-video");
            videojs(vid).dispose();

            videoContainer.innerHTML = createVideoHtml(message.videoSource, '', message.type);
            vid = document.getElementById('my-video');

            switch (message.type) {
                case 'native':
                    player = videojs(vid);
                    player.play();
                    break;

                case 'stream':
                    player = videojs(vid, {
                        techOrder: ['StreamPlay'],
                        StreamPlay: { duration: message.duration }
                    }, () => {
                        player.play()
                    });
                    break;

                case 'youtube':
                    player = videojs(vid, {
                        techOrder: ['youtube'],
                        youtube: {
                        //    ytControls: 2,
                        //    iv_load_policy: 1,
                        },
                        sources: [{
                            type: 'video/youtube',
                            src: message.videoSource,
                        }]
                    }, () => {
                        player.play()
                    });
                    break;
            }
        });

        ipcRenderer.on('run-loader', (e, service) => {
            if (isLoading()) return;

            animateLoader(service);
            console.log(`Switching to service ${service.name}} at the URL ${service.url}...`);
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

body {
    -webkit-app-region: drag;
    margin: 0;
    background-color: rgba(52, 52, 52, 0.95);
    display: grid;
    height: 100vh;
}

#video-container,
#my-video {
    width: 100vw;
    height: 100vh;
}

.loader > img {
    margin: 0 auto;
    display: block;
    height: 110px;
    width: auto;
    padding: 5px 0;
    -webkit-user-drag: none;
    -webkit-app-region: no-drag;
}

.loader {
    position: fixed;
    transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1); /* easeOutQuint */
    z-index: 100;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.loader > .ripple {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    animation: ripple 0.8s 0.2s cubic-bezier(0.23, 1, 0.32, 1) infinite; /* easeOutQuint */
    background-color: white; /* will be replaced later by JS */
    z-index: -1;
    transform-origin: top left;
    transform: scale(0) translate(-50%, -50%);
}

@keyframes ripple {
    from {
        opacity: 0.8;
        transform: scale(0) translate(-50%, -50%);
    }

    to {
        opacity: 0;
        transform: scale(1) translate(-50%, -50%);
    }
}
</style>
