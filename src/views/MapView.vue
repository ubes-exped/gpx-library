<template>
  <div class="map-view">
    <Sidebar
      :walks="walks"
      :selected="selected"
      use-tags
      @hover-point="hoverPoint"
    />
    <Map
      :center.sync="location"
      :zoom.sync="zoom"
      :walks="walks"
      :selected="selected"
      :hovered-point="hoveredPoint"
    />
    <Help v-if="showHelp" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Map from "@/components/Map.vue";
import Sidebar from "@/components/Sidebar.vue";
import Help from "@/components/Help.vue";
import Walk, { PointOnLine } from "@/interfaces/Walk";

@Component({
  components: { Map, Sidebar, Help }
})
export default class MapView extends Vue {
  @Prop() walks!: Walk[];

  location = { lat: 51.45, lng: -2.6 };

  @Prop({ default: null }) selectedHash!: string | null;

  selected: Walk | null = null;

  zoom = 10;

  @Prop(Boolean) showHelp!: boolean;

  hoveredPoint: PointOnLine | null = null;

  hoverPoint(point?: PointOnLine) {
    this.hoveredPoint = point ?? null;
  }

  @Watch("selectedHash") @Watch("walks", { immediate: true }) onWalks() {
    const browserSelected = this.selectedHash;
    if (browserSelected) {
      this.selected =
        this.walks.find(walk => walk.id === browserSelected) ?? null;
    } else {
      this.selected = null;
    }
  }

  hashchangeListener?: () => void;

  mounted() {
    this.hashchangeListener = () => this.onWalks();
    window.addEventListener("hashchange", this.hashchangeListener);
  }

  beforeDestroy() {
    if (this.hashchangeListener) {
      window.removeEventListener("hashchange", this.hashchangeListener);
    }
  }
}
</script>

<style scoped>
.map-view {
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
}
</style>
