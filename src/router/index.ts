import { createRouter, createWebHistory } from 'vue-router';
import { appName } from '@/config';
import MapPage from '@/pages/MapPage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'MapPage',
      component: MapPage,
      props: { filterFromUrl: '', selectedHash: null },
    },
    {
      path: '/walk/:id',
      name: 'Walk',
      meta: { title: '' },
      component: MapPage,
      props: (route) => ({ selectedHash: route.params.id }),
    },
    {
      path: '/filter/:filter',
      name: 'Filter',
      meta: { title: '' },
      component: MapPage,
      props: (route) => ({ filterFromUrl: route.params.filter }),
    },
    {
      path: '/filter',
      name: 'MaybeFilter',
      meta: { title: '' },
      component: MapPage,
      props: { redirectToFilter: true },
    },
    {
      path: '/about',
      name: 'About',
      meta: { title: 'About' },
      component: MapPage,
      props: { showHelp: true },
    },
    {
      path: '/contribute',
      name: 'Upload',
      meta: { title: 'Upload' },
      component: MapPage,
      props: { showUpload: true },
    },
    {
      path: '/:catchAll(.*)*',
      name: 'Unknown',
      redirect: { name: 'MapPage' },
    },
  ],
});

router.beforeEach((to, from, next) => {
  /* It will change the title when the router is change */
  document.title = [to.meta.title, appName].filter(Boolean).join(' • ');
  next();
});

export default router;
