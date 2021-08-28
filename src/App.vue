<template>
    <div class="w-screen h-screen">
        <transition>
            <router-view></router-view>
        </transition>
        <div class="radial-menu-wrapper">
            <radial-menu :reset="resetMenu"></radial-menu>
        </div>
    </div>
</template>

<script>
import RadialMenu from '@/components/RadialMenu.vue';
import EventBus from './EventBus';

export default {
    name: 'app',
    data() {
        return {
            resetMenu: false,
        };
    },
    components: {
        RadialMenu,
    },
    mounted() {
        EventBus.$on('reset-radial-menu', (reset) => {
            this.resetMenu = reset;
        });
    },
};
</script>

<style>
.radial-menu-wrapper {
    position: absolute;
    left: 10px;
    bottom: 10px;
}
</style>
