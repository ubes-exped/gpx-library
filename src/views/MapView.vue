<template>
  <div class="map-view">
    <Sidebar
      :walks="filteredWalks"
      :selected="selected"
      :use-tags="useTags"
      :all-tags="allTags"
      :filter="tagFilter"
      @update:filter="updateFilter"
      @hover-point="hoverPoint"
    />
    <Map
      :center.sync="location"
      :zoom.sync="zoom"
      :walks="filteredWalks"
      :selected="selected"
      :hovered-point="hoveredPoint"
    />
    <Help v-if="showHelp" />
    <Upload v-if="showUpload" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Sidebar from "@/components/Sidebar.vue";
import Help from "@/components/Help.vue";
import Upload from "@/components/Upload.vue";
import Walk, { PointOnLine } from "@/interfaces/Walk";
import { tagComparator } from "@/utils/comparators";

@Component({
  components: {
    Map: () => import(/* webpackChunkName: "map" */ "@/components/Map.vue"),
    Sidebar,
    Help,
    Upload,
  },
})
export default class MapView extends Vue {
  @Prop() walks!: Walk[];

  location = { lat: 51.45, lng: -2.6 };

  @Prop({ default: null }) selectedHash!: string | null;

  selected: Walk | null = null;

  zoom = 10;

  useTags = true;

  tagFilter = "";

  @Prop() filterFromUrl?: string;

  @Prop({ default: false }) redirectToFilter = false;

  @Watch("filterFromUrl", { immediate: true })
  updateFilterFromUrl(filterFromUrl: string | undefined) {
    if (filterFromUrl !== undefined) {
      this.tagFilter = filterFromUrl;
    }
  }

  @Watch("redirectToFilter")
  performRedirectToFilter(redirectToFilter: boolean) {
    if (redirectToFilter) {
      this.$router.replace({ name: this.tagFilter ? "Filter" : "MapView", params: { ...this.$route.params, filter: this.tagFilter } });
    }
  }

  get filteredWalks(): Walk[] {
    if (!this.tagFilter || !this.useTags) return this.walks;

    const filtered = this.walks.filter((walk) => walk.tags?.includes(this.tagFilter));
    if (
      this.selected
      && !filtered.find((walk) => walk.index === this.selected?.index)
    ) {
      this.selected = null;
    }
    return filtered;
  }

  /**
   * Get all the tags, sorted in alphabetical order,
   * with entries with colons first and then capital letters first.
   */
  get allTags() {
    return Array.from(
      new Set(this.walks.flatMap((walk) => walk.tags ?? [])),
    ).sort(tagComparator);
  }

  @Prop(Boolean) showHelp!: boolean;

  @Prop(Boolean) showUpload!: boolean;

  hoveredPoint: PointOnLine | null = null;

  hoverPoint(point?: PointOnLine) {
    this.hoveredPoint = point ?? null;
  }

  updateFilter(filter: string) {
    this.tagFilter = filter;
    if (this.filterFromUrl !== undefined) {
      this.performRedirectToFilter(true);
    }
  }

  @Watch("selectedHash") @Watch("walks", { immediate: true }) onWalks() {
    const browserSelected = this.selectedHash;
    if (browserSelected) {
      this.selected = this.walks.find((walk) => walk.id === browserSelected) ?? null;
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
