<script setup lang="ts">
import type { PointOnLine } from '@/interfaces/Point';
import type Walk from '@/interfaces/Walk';
import { tagComparator } from '@/utils/comparators';
import throttle from '@/utils/throttle';
import { computed } from 'vue';
import MaterialIcon from './MaterialIcon.vue';

const { walk } = defineProps<{
  walk: Walk;
  selected?: boolean;
}>();

const emit = defineEmits<{
  select: [];
  hoverPoint: [point: PointOnLine | undefined];
  setTagFilter: [tagFilter: string];
}>();

const graphHover = throttle(
  (walk: Walk, event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const box = target.getBoundingClientRect();
    const offset = (event.clientX - box.x) / box.width;
    const point = walk.getOffset(offset);
    emit('hoverPoint', point);
  },
  () => {
    emit('hoverPoint', undefined);
  },
);

const tags = computed(() => walk.tags?.toSorted(tagComparator));
</script>

<template>
  <li :key="walk.id" :class="[$style.walk, selected && $style.selected]" @click="emit('select')">
    <h3>{{ walk.name }}</h3>
    <p :class="$style.stats">
      ↔︎ {{ walk.distance.toFixed(1) }} km, ↗︎ {{ walk.ascent.toFixed(0) }} m
    </p>
    <div v-if="selected" :class="$style.details">
      <div @mousemove="graphHover.send(walk, $event)" @mouseleave="graphHover.clear()">
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
      <div :class="$style.tags">
        <span v-for="tag of tags" :key="tag" :class="$style.tag" @click="emit('setTagFilter', tag)">
          {{ tag }}
        </span>
      </div>
      <p :class="$style.download">
        <a :href="walk.filename" download>
          GPX
          <MaterialIcon inline large>get_app</MaterialIcon>
        </a>
      </p>
    </div>
  </li>
</template>

<style lang="scss" module>
@use '@/styles/tablet';

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
