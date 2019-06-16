import Vue from 'vue'
import VuePlyr from 'vue-plyr'
import 'vue-plyr/dist/vue-plyr.css'
import App from './App.vue'

Vue.config.productionTip = false

Vue.use(VuePlyr)

new Vue({
    render: h => h(App),
}).$mount('#app')
