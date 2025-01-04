<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Walk, { RawWalk } from "@/interfaces/Walk";
import { appName, routesFile } from "@/config";

@Component
export default class Home extends Vue {
  appName = appName;

  walks: Walk[] = [];

  async created() {
    const walksResponse = await fetch(
      routesFile,
    );
    const rawWalks: RawWalk[] = await walksResponse.json();
    this.walks = rawWalks.map((walk) => new Walk(walk));
  }
}
</script>

<template>
  <div id="app">
    <router-view :walks="walks" />
  </div>
</template>

<style>
:root {
  --transition-speed: 0.5s;
  font-size: 12px;
}

a {
  color: var(--link-color);
}

html,
body {
  height: 100%;
  overflow: hidden;
  margin: 0;
  background-color: var(--background);
}

@media screen and (min-width: 800px) {
  :root {
    font-size: 14px;
  }
}

@media screen and (min-width: 1000px) {
  :root {
    font-size: 16px;
  }
}

@media screen and (min-width: 1500px) {
  :root {
    font-size: 18px;
  }
}

#app {
  height: 100%;
  display: flex;
  align-items: stretch;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color);
  background-color: var(--background);
  transition: font-size var(--transition-speed);
}

:root {
  --color: #222;
  --link-color: #00e;
  --background: #fff;
  --background-slight: #eee;
  --background-strong: #ccc;
  --overlay-color: rgba(255, 255, 255, 0.5);
  --invert: 0%;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color: #fff;
    --link-color: #8cf;
    --background: #222;
    --background-slight: #333;
    --background-strong: #555;
    --overlay-color: rgba(0, 0, 0, 0.5);
    --invert: 100%;
  }
}
</style>
