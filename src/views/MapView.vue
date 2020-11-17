<template>
  <div class="map">
    <Map
      :center.sync="location"
      :zoom.sync="zoom"
      :walks="walks"
      :selected.sync="selected"
    />
    <Sidebar :walks="walks" :selected.sync="selected" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import HelloWorld from '@/components/HelloWorld.vue';
import Map from '@/components/Map.vue';
import Sidebar from '@/components/Sidebar.vue';
import Walk from '@/interfaces/Walk';

@Component({
  components: { HelloWorld, Map, Sidebar },
})
export default class Home extends Vue {
  @Prop() walks!: Walk[];

  location = { lat: 51.45, lng: -2.6 };

  selected: number | null = null;

  zoom = 10;
}
</script>

<style scoped>
.map {
  display: flex;
  flex-direction: row;
  flex: 1;
}
</style>
