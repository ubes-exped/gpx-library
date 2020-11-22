<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Map</router-link>
      |
      <router-link to="/about">About</router-link>
    </div>
    <router-view :walks="walks" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Walk, { RawWalk } from "@/interfaces/Walk";
import { appName } from "./config";

@Component
export default class Home extends Vue {
  appName = appName;

  walks: Walk[] = [];

  async created() {
    const walksResponse = await fetch(
      "https://routes.ubes.co.uk/generated/data.json"
    );
    const rawWalks: RawWalk[] = await walksResponse.json();
    this.walks = rawWalks.map(walk => new Walk(walk));
  }
}
</script>

<style>
:root {
  --transition-speed: 0.5s;
  font-size: 12px;
  transition: font-size var(--transition-speed);
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
}

#nav {
  padding: 30px;
  text-align: center;
  display: none;
}

#nav a {
  font-weight: bold;
  color: inherit;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

:root {
  --color: #222;
  --background: #fff;
  --background-slight: #eee;
  --background-strong: #ccc;
  --invert: 0%;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color: #fff;
    --background: #222;
    --background-slight: #333;
    --background-strong: #555;
    --invert: 100%;
  }
}
</style>
