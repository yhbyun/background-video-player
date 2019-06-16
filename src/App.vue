<template>
    <div id="app">
        <vue-plyr ref="plyr">
            <video poster="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg" src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4">
                <source src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4" type="video/mp4" size="720">
                <source src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4" type="video/mp4" size="1080">
            </video>
        </vue-plyr>
    </div>
</template>

<script>
import { ipcRenderer, remote } from 'electron'
import fs from 'fs'

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

        ipcRenderer.on('openFile', () => {
            this.openFile();
        });
    },
    methods: {
        openFile() {
            let file = remote.dialog.showOpenDialog({ properties: ['openFile'] });
            if (file && file.length === 1) {
                const source = fs.readFileSync(file[0])

                this.player.source = {
                    type: 'video',
                    sources: [
                        {
                            src: URL.createObjectURL(new Blob([source], { type: 'video/mp4' }))
                        },
                    ],
                };

                this.player.play();
            }
        },
    },
}
</script>

<style>
</style>
