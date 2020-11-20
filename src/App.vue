<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/map">Map</router-link>
    </div>
    <router-view :walks="walks" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Walk from '@/interfaces/Walk';
import appName from './appName';

@Component
export default class Home extends Vue {
  appName = appName;

  walks: Walk[] = [];

  async created() {
    const walksResponse = await fetch('https://routes.ubes.co.uk/generated/data.json');
    const rawWalks: Omit<Walk, 'id'>[] = await walksResponse.json();
    this.walks = rawWalks.map((walk, id) => ({ ...walk, id }));
  }
}
</script>

<style>
html,
body {
  height: 100%;
  overflow: hidden;
  margin: 0;
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
}

@media (prefers-color-scheme: dark) {
  :root {
    --color: #fff;
    --background: #222;
    --background-slight: #333;
    --background-strong: #555;
  }
}
</style>
