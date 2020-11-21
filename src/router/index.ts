import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import { appName } from '@/config';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/about',
    name: 'Home',
    component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
  },
  {
    path: '/',
    name: 'MapView',
    meta: { title: 'Map View' },
    component: () => import(/* webpackChunkName: "map" */ '@/views/MapView.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  /* It will change the title when the router is change */
  document.title = [to.meta.title, appName].filter(Boolean).join(' • ');
  next();
});

export default router;
