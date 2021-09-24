<template>
    <div>
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
            style="top: 10px; right: 10px"
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
                class="w-full h-full p-4"
                src="https://ritmoromantica.pe/radioenvivo"
                :preload="preload"
                v-show="showRitmoWV"
            />
        </div>
        <div
            class="
                lyric-wrapper
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
            <tooltip-translator
                container=".lyric-wrapper"
                :listenMouseMove="true"
                :detectType="detectType"
            />
        </div>
    </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import * as remote from '@electron/remote';
import path from 'path';
import { getTranslation } from '@/services/translate';
import { getLyric } from '@/services/lyric';
import TooltipTranslator from '@/components/TooltipTranslator.vue';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';
import EventBus from '../EventBus';

export default {
    name: 'RitmoPlayer',
    components: {
        TooltipTranslator,
        Loading,
    },
    data() {
        return {
            preload: 'file://' + path.join(__static, 'ritmo-inject.js'),
            songTitle: '',
            enSongTitle: '',
            artist: '',
            lyric: '',
            isLyricLoading: false,
            showRitmoWV: true,
            detectType: 'word',
        };
    },
    mounted() {
        this.addDomReadyListener('wvRitmo');

        document.onkeydown = (event) => {
            console.log('onkeydown', event);
            if (event.key === 'Meta') {
                this.detectType = 'sentence';
            }
        };

        document.onkeyup = (event) => {
            console.log('onkeyup', event);
            if (event.key === 'Meta') {
                this.detectType = 'word';
            }
        };

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
    },
    methods: {
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
        addDomReadyListener(wvName) {
            this.$refs[wvName] &&
                this.$refs[wvName].addEventListener('dom-ready', () => {
                    console.log(`${wvName} dom-ready`);
                    EventBus.$emit('service-loaded');

                    if (wvName === 'wvRitmo') {
                        this.playRitmo();
                    }

                    if (
                        remote.process.env.NODE_ENV &&
                        remote.process.env.NODE_ENV !== 'production'
                    ) {
                        this.$refs[wvName].openDevTools();
                    }
                });
        },
    },
};
</script>
