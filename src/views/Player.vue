<template>
    <div>
        <div
            id="video-container"
            ref="videoContainer"
            v-show="mode === 'video'"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave"
        >
            <video-player
                class="vjs-custom-skin"
                ref="videoPlayer"
                :options="videoOptions"
            />
        </div>
        <webview
            id="wv-browser"
            ref="wvBrowser"
            class="w-full h-full min-h-screen"
            :src="webviewUrl"
            :preload="preload"
            v-show="mode === 'browser'"
        />
        <div
            class="flex flex-wrap w-full h-screen"
            v-show="mode === 'ritmo'"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave"
        >
            <button
                class="
                    absolute
                    bg-green-500
                    hover:bg-green-700
                    text-white
                    font-medium
                    py-2
                    px-4
                    rounded-full
                "
                style="top: 40px; right: 10px"
                @click="showRitmoWV = !showRitmoWV"
            >
                {{ showRitmoWV ? 'Close' : 'Restore' }}
            </button>
            <div
                class="w-full"
                :class="{ 'h-1/2': showRitmoWV, 'h-0': !showRitmoWV }"
            >
                <webview
                    id="wv-ritmo"
                    ref="wvRitmo"
                    class="w-full h-full"
                    src="https://ritmoromantica.pe/radioenvivo"
                    :preload="preloadRitmo"
                    v-show="showRitmoWV"
                />
            </div>
            <div
                class="
                    p-4
                    w-full
                    bg-black bg-opacity-75
                    text-gray-300 text-center text-sm
                    font-thin
                    overflow-auto
                "
                :class="{ 'h-1/2': showRitmoWV, 'h-full': !showRitmoWV }"
            >
                <div class="text-green-400">
                    <div class="font-medium" v-html="songTitle" />
                    <div class="font-thin" v-html="artist" />
                    <div v-if="enSongTitle">
                        <span
                            class="
                                text-xs
                                font-semibold
                                inline-block
                                py-1
                                px-2
                                uppercase
                                rounded
                                text-green-800
                                bg-green-400
                                last:mr-0
                                mr-1
                            "
                        >
                            english
                        </span>
                        <span class="italic">
                            {{ enSongTitle }}
                        </span>
                    </div>
                </div>
                <div class="lyric p-4 overscroll-auto" v-html="lyric"></div>
                <loading
                    :active.sync="isLyricLoading"
                    :can-cancel="false"
                    :is-full-page="false"
                    color="#820263"
                ></loading>
                <tooltip-translator :listenMouseMove="true" />
            </div>
        </div>
        <div class="loader" v-show="isLoading">
            <div class="ripple" ref="ripple" />
            <img ref="loaderImage" />
        </div>
    </div>
</template>

<script>
/* global __static */

import { ipcRenderer } from 'electron';
import * as remote from '@electron/remote';
import 'videojs-youtube';
import '../StreamPlayTech';
import path from 'path';
import VideoPlayer from '@/components/VideoPlayer.vue';
import '../videojs-custom-theme.css';
import EventBus from '../EventBus';
import { getTranslation } from '@/services/translate';
import { getLyric } from '@/services/lyric';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';
import TooltipTranslator from '@/components/TooltipTranslator.vue';

export default {
    name: 'player',
    components: {
        VideoPlayer,
        Loading,
        TooltipTranslator,
    },
    props: {
        useSampleVideo: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            videoOptions: {
                autoplay: false,
                controls: true,
                preload: 'auto',
                sources: this.useSampleVideo
                    ? [
                          {
                              src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
                              type: 'video/mp4',
                          },
                      ]
                    : null,
                poster: this.useSampleVideo
                    ? 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg'
                    : null,
            },
            mode: this.useSampleVideo ? 'video' : 'browser',
            webviewUrl: '',
            isLoading: false,
            preload: 'file://' + path.join(__static, 'webview-inject.js'),
            preloadRitmo: 'file://' + path.join(__static, 'ritmo-inject.js'),
            songTitle: '',
            enSongTitle: '',
            artist: '',
            lyric: '',
            isLyricLoading: false,
            showRitmoWV: true,
        };
    },
    computed: {
        player() {
            return this.$refs.videoPlayer.player;
        },
    },
    mounted() {
        this.$refs.wvBrowser.addEventListener('dom-ready', () => {
            console.log('wvBrowser dom-ready');
            this.isLoading = false;

            if (
                remote.process.env.NODE_ENV &&
                remote.process.env.NODE_ENV !== 'production'
            ) {
                this.$refs.wvBrowser.openDevTools();
            }
        });

        this.$refs.wvRitmo.addEventListener('dom-ready', () => {
            console.log('wvRitmo dom-ready');
            this.isLoading = false;

            if (
                remote.process.env.NODE_ENV &&
                remote.process.env.NODE_ENV !== 'production'
            ) {
                this.$refs.wvRitmo.openDevTools();
            }
        });

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

        EventBus.$on('change-service', (serviceName) => {
            (async () => {
                console.log(serviceName);
                const service = await ipcRenderer.invoke(
                    'getService',
                    serviceName
                );

                if (!service) {
                    console.error(`Cannot find ${serviceNzme} service`);
                    return;
                }

                this.changeMode({ name: 'browser', service: service });
                this.animateLoader(service);
            })();
        });

        EventBus.$on('history-back', () => {
            if (this.mode === 'browser') {
                this.$refs.wvBrowser.goBack();
            }
        });

        ipcRenderer.on('play-control', (event, message) => {
            if (this.player) {
                if (message === 'play') {
                    this.player.play();
                } else if (message === 'pause') {
                    this.player.pause();
                }
            }
        });

        ipcRenderer.on('enter-window', (event, message) => {
            document.body.classList.add('hovering');
            document.body.classList.remove('no-hovering');
            EventBus.$emit('reset-radial-menu', false);
        });

        ipcRenderer.on('leave-window', (event, message) => {
            document.body.classList.add('no-hovering');
            document.body.classList.remove('hovering');
            EventBus.$emit('reset-radial-menu', true);
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
                        options.techOrder = ['youtube'];
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
            this.changeMode(route);
        });

        ipcRenderer.on('toggleSidedock', (e, enable) => {
            ipcRenderer.send('toggleSidedock', enable);
        });

        // song string format: singer - song title
        ipcRenderer.on('songChanged', async (e, song) => {
            this.songTitle = song.title;
            this.artist = song.artist;
            this.enSongTitle = '';
            this.lyric = '';

            try {
                const result = await getTranslation(this.songTitle, {
                    from: 'es',
                    to: 'en',
                });
                this.enSongTitle = result.translation[0][5][0][0];
                ipcRenderer.send('setTrayToolTip', this.enSongTitle);
            } catch (e) {
                console.error(e);
            }

            await this.displayLyric();
        });

        ipcRenderer.send('ipcRendererReady', 'true');
    },
    watch: {
        mode: {
            handler(mode, oldMode) {
                if (oldMode === 'video' && this.player) {
                    this.player.pause();
                } else if (mode === 'ritmo') {
                    this.playRitmo();
                } else if (oldMode === 'ritmo') {
                    this.pauseRitmo();
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
        changeMode(route) {
            if (route.name === 'browser') {
                // this.mode = 'browser';
                this.mode =
                    route.service && route.service.name === 'Ritmo Romantica'
                        ? 'ritmo'
                        : 'browser';
                this.webviewUrl = route.url || route.service.url;
                console.log('Changing URL To: ' + this.webviewUrl);

                ipcRenderer.send('setStatus', 'curUrl', route.url);
                ipcRenderer.send('setStatus', 'curService', route.service);

                if (route.service && route.service.name) {
                    ipcRenderer.send('setTrayTitle', route.service.name);
                } else {
                    ipcRenderer.send('setTrayTitle', '');
                }
            } else {
                this.mode = 'video';
            }
        },
        mouseEnter() {
            console.log('mouseEnter');
            ipcRenderer.send('mouseEnter');
        },
        mouseLeave() {
            console.log('mouseLeave');
            ipcRenderer.send('mouseLeave');
        },
        playRitmo() {
            this.$refs.wvRitmo.send('play');
        },
        pauseRitmo() {
            this.$refs.wvRitmo.send('pause');
        },
        async displayLyric() {
            if (!this.songTitle) return;

            // not artist info
            // Sáb. -  10:00 am - 01:00 pm
            if (
                this.artist.includes(' am') &&
                this.artist.includes(' pm') &&
                this.artist.split(' - ').length === 3
            ) {
                return;
            }

            this.isLyricLoading = true;
            const lyric = await getLyric(this.artist, this.songTitle);
            this.lyric = lyric;
            document.querySelector('.lyric').scrollTop = 0;
            this.isLyricLoading = false;
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
