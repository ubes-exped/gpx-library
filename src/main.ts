import Vue from 'vue';
import VueHead from 'vue-head';
import App from '@/App.vue';
import router from '@/router';

Vue.config.productionTip = false;

Vue.use(VueHead);

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
