<template>
    <div>
        <div
            id="video-container"
            ref="videoContainer"
            v-show="mode === 'video'"
        >
            <video-player
                class="vjs-custom-skin"
                ref="videoPlayer"
                :options="videoOptions"
            />
        </div>
        <webview
            id="wv-browser"
            class="w-screen h-screen"
            :src="webviewUrl"
            v-show="mode === 'browser'"
        />
        <div class="loader" v-show="isLoading">
            <div class="ripple" ref="ripple" />
            <img ref="loaderImage" />
        </div>
    </div>
</template>

<script>
/* global __static */

import { ipcRenderer } from 'electron';
import 'videojs-youtube';
import '../StreamPlayTech';
import path from 'path';
import VideoPlayer from '@/components/VideoPlayer.vue';
import '../videojs-custom-theme.css';

export default {
    name: 'player',
    components: {
        VideoPlayer,
    },
    data() {
        return {
            videoOptions: {
                autoplay: false,
                controls: true,
                preload: 'auto',
                sources: [
                    {
                        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
                        type: 'video/mp4',
                    },
                ],
                poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
            },
            mode: 'video',
            webviewUrl: '',
            isLoading: false,
        };
    },
    computed: {
        player() {
            return this.$refs.videoPlayer.player;
        },
    },
    mounted() {
        var wvBrowser = document.getElementById('wv-browser');
        wvBrowser.addEventListener('dom-ready', () => (this.isLoading = false));

        document.onkeydown = (event) => {
            console.log('onkeypress', event);
            if (event.code === 'Space') {
                if (this.player) {
                    if (this.player.paused()) {
                        this.player.play();
                    } else {
                        this.player.pause();
                    }
                }
                return false;
            }
        };

        ipcRenderer.on('play-control', (event, message) => {
            if (this.player) {
                if (message === 'play') {
                    this.player.play();
                } else if (message === 'pause') {
                    this.player.pause();
                }
            }
        });

        ipcRenderer.on('openFile', (event, message) => {
            ipcRenderer.send('fileDrop', message);
        });

        ipcRenderer.on('fileSelected', (event, message) => {
            console.log('fileSelected:', message);

            (async () => {
                const loop = await ipcRenderer.invoke(
                    'getStoreValue',
                    'options.loop',
                    false
                );

                let options = {};

                switch (message.type) {
                    case 'native':
                        message.type = 'video/mp4';
                        break;

                    case 'stream':
                        options.techOrder = ['StreamPlay'];
                        options.StreamPlay = {
                            duration: message.duration,
                        };
                        message.type = 'video/mp4';
                        break;

                    case 'youtube':
                        optioptionson.techOrder = ['youtube'];
                        message.type = 'video/youtube';
                        break;
                }

                options.autoplay = true;
                options.loop = loop;
                options.sources = [
                    {
                        type: message.type,
                        src: message.videoSource,
                    },
                ];
                options.poster = null;

                this.videoOptions = Object.assign(
                    {},
                    this.videoOptions,
                    options
                );
            })();

            this.mode = 'video';
        });

        ipcRenderer.on('run-loader', (e, service) => {
            if (this.isLoading) return;

            this.animateLoader(service);
            console.log(
                `Switching to service ${service.name} at the URL ${service.url}...`
            );
        });

        ipcRenderer.on('changeMode', (e, route) => {
            if (route.name === 'browser') {
                this.mode = 'browser';
                this.webviewUrl = route.url;
                console.log('Changing URL To: ' + route.url);
            } else {
                this.mode = 'video';
            }
        });

        ipcRenderer.send('ipcRendererReady', 'true');
    },
    watch: {
        mode: {
            handler(mode, oldMode) {
                if (oldMode === 'video' && this.player) {
                    this.player.pause();
                }
            },
        },
    },
    methods: {
        animateLoader(service) {
            const img = this.$refs.loaderImage;
            // Check if the service is the same as the previous service
            if (img.getAttribute('id') !== service.name) {
                img.setAttribute('id', service.name);
                img.setAttribute(
                    'src',
                    'file://' + path.join(__static, service.logo)
                );
                img.setAttribute('alt', service.name);

                this.$refs.ripple.style.backgroundColor = service.color;

                this.isLoading = true;
            }
        },
    },
};
</script>

<style>
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
