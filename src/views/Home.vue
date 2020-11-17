<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import Vue from 'vue';
import Component from 'vue-class-component';
import HelloWorld from '@/components/HelloWorld.vue';
import Map from '@/components/Map.vue';

@Component({
  components: { HelloWorld, Map },
})
export default class Home extends Vue {
  location = { lat: 51.45, lng: -2.6 };
}
</script>

<style scoped>
.home {
  text-align: center;
}
</style>
