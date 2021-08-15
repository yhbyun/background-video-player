import Vue from 'vue';
import VueRouter from 'vue-router';
import Player from './views/Player.vue';

Vue.use(VueRouter);

export default new VueRouter({
    mode: process.env.IS_ELECTRON ? 'hash' : 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'player',
            component: Player,
            props: (route) => ({
                useSampleVideo: route.query.useSampleVideo === 'true',
            }),
        },
    ],
});
