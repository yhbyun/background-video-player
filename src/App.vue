<template>
    <div id="app">
        <vue-plyr ref="plyr">
            <video poster="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg" src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4">
                <source src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4" type="video/mp4" size="720">
                <source src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4" type="video/mp4" size="1080">
                <track kind="captions" label="English" srclang="en" src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.en.vtt" default>
            </video>
        </vue-plyr>
    </div>
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
    name: 'app',
    computed: {
        player () { return this.$refs.plyr.player },
    },
    mounted () {
        ipcRenderer.on('play-control', (event, message) => {
            if (message === 'play') {
                this.player.play();
            } else if (message === 'pause') {
                this.player.pause();
            }
        })
    },
}
</script>

<style>
</style>
