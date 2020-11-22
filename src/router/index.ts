import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import { appName } from "@/config";
import MapView from "@/views/MapView.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "MapView",
    meta: { title: "" },
    component: MapView,
  },
  {
    path: "/walk/:id",
    name: "Walk",
    meta: { title: "" },
    component: MapView,
    props: (route) => ({ selectedHash: route.params.id }),
  },
  {
    path: "/about",
    name: "About",
    meta: { title: "About" },
    component: MapView,
    props: { showHelp: true },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  /* It will change the title when the router is change */
  document.title = [to.meta.title, appName].filter(Boolean).join(" • ");
  next();
});

export default router;
