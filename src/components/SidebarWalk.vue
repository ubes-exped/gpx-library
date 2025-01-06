<script lang="ts">
import {
  Component,
  Vue,
  Prop,
  Emit,
} from "vue-property-decorator";
import Walk from "@/interfaces/Walk";
import { tagComparator } from "@/utils/comparators";
import Icon from "./Icon.vue";
import throttle from "../utils/throttle";

@Component({
  components: { Icon },
})
export default class SidebarWalk extends Vue {
  @Prop({ required: true }) walk!: Walk;

  @Prop(Boolean) selected!: boolean;

  @Prop(Boolean) useTags!: boolean;

  @Emit("select") select() {
  }

  @Emit("hover-point") hoverPoint(point?: { lat: number; long: number }) {
    return point;
  }

  @Emit("update:tagFilter") updateTagFilter(tagFilter: string) {
    return tagFilter;
  }

  get tags() {
    return Array.from(this.walk.tags ?? []).sort(tagComparator);
  }

  graphHover = throttle(
    (walk: Walk, event: MouseEvent) => {
      if (!walk || !event) return;
      const target = event.target as HTMLElement;
      const box = target.getBoundingClientRect();
      const offset = (event.clientX - box.x) / box.width;
      const point = walk.getOffset(offset);
      this.hoverPoint(point);
    },
    () => this.hoverPoint(),
  );
}
</script>

<template>
  <li
    :key="walk.index"
    :class="['walk', { selected }]"
    @click="select()"
  >
    <h3>{{ walk.name }}</h3>
    <p class="stats">
      ↔︎ {{ walk.distance.toFixed(1) }} km, ↗︎
      {{ walk.ascent.toFixed(0) }} m
    </p>
    <div
      v-if="selected"
      class="details"
    >
      <div
        @mousemove="graphHover.send(walk, $event)"
        @mouseleave="graphHover.clear()"
      >
        <svg
          :viewBox="`0 -2 ${walk.elevationGraph.width} ${walk.elevationGraph.height + 4}`"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            :d="walk.elevationGraph.lineString"
            stroke="var(--color)"
            stroke-width="4"
            stroke-linecap="square"
            stroke-linejoin="round"
            fill="transparent"
          />
        </svg>
      </div>
      <p v-if="walk.author">
        Created by <cite>{{ walk.author }}</cite>
      </p>
      <p>{{ walk.description }}</p>
      <div
        v-if="useTags"
        class="tags"
      >
        <span
          v-for="tag of tags"
          :key="tag"
          class="tag"
          @click="updateTagFilter(tag)"
        >
          {{ tag }}
        </span>
      </div>
      <p class="download">
        <a
          :href="walk.filename"
          download
        >
          GPX
          <icon
            inline
            large
          >get_app</icon>
        </a>
      </p>
    </div>
  </li>
</template>

<style lang="scss" scoped>
@use 'src/styles/tablet';

.walk {
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &.selected {
    background-color: var(--background-strong);
    cursor: unset;
    scroll-margin: 4em;
  }

  h3 {
    position: sticky;
    top: 0;
    background: inherit;
  }

  h3,
  p {
    margin: 0;
    padding: 0.25em 0;
  }

  .tags {
    .tag {
      @include tablet.full;
      cursor: pointer;
    }
  }

  .download {
    text-align: end;

    a {
      color: var(--color) !important;
      text-decoration: none;
    }
  }
}
</style>
