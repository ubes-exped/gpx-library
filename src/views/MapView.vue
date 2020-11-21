<template>
  <div class="map-view">
    <Sidebar
      :walks="walks"
      :selected.sync="selected"
      @zoom-to-selected="zoomToSelected"
      @hover-point="hoverPoint"
    />
    <Map
      :center.sync="location"
      :zoom.sync="zoom"
      :walks="walks"
      :selected.sync="selected"
      :hovered-point="hoveredPoint"
      ref="map"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Ref, Watch } from "vue-property-decorator";
import Map from "@/components/Map.vue";
import Sidebar from "@/components/Sidebar.vue";
import Walk, { PointOnLine } from "@/interfaces/Walk";

@Component({
  components: { Map, Sidebar }
})
export default class MapView extends Vue {
  @Ref() map!: Map;

  @Prop() walks!: Walk[];

  location = { lat: 51.45, lng: -2.6 };

  selected: number | null = null;

  zoom = 10;

  hoveredPoint: PointOnLine | null = null;

  zoomToSelected(selection: number) {
    this.selected = selection;
    this.map.zoomToSelected();
  }

  hoverPoint(point?: PointOnLine) {
    this.hoveredPoint = point ?? null;
  }

  getHash(): string {
    return window.location.hash.replace(/^#/, "");
  }
  setHash(newHash: string) {
    if (this.getHash() !== newHash) {
      history.replaceState(undefined, newHash, "#" + newHash);
    }
  }

  @Watch("walks", { immediate: true }) onWalks() {
    const browserSelected = this.getHash();
    if (browserSelected) {
      this.selected =
        this.walks.find(walk => walk.id === browserSelected)?.index ?? null;
    }
  }

  @Watch("selected") onSelected() {
    this.setHash(
      this.walks.find(walk => walk.index === this.selected)?.id ?? ""
    );
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
