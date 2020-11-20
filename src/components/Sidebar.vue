<template>
  <div class="sidebar">
    <ul>
      <li
        v-for="walk of walks"
        :key="walk.index"
        :class="{ selected: walk.index === selected }"
      >
        <h2>{{ walk.name }}</h2>
        <h4>
          ↔︎ {{ walk.distance.toFixed(1) }} km, ↗︎
          {{ walk.ascent.toFixed(0) }} m
        </h4>
        <cite>{{ walk.author }}</cite>
        <p>{{ walk.description }}</p>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {
  Component, Vue, PropSync, Prop, Watch,
} from 'vue-property-decorator';
import Walk from '@/interfaces/Walk';

@Component
export default class Sidebar extends Vue {
  @Prop({ default: () => [] }) walks!: Walk[];

  @PropSync('selected', { default: () => null }) modelSelected!: number | null;

  localSelected?: number | null = this.modelSelected;

  select(id: number | null, e: MouseEvent) {
    if (e.detail > 1) return;
    this.localSelected = id;
    this.modelSelected = id;
  }

  @Watch('selected') async onSelected(selected: null | undefined) {
    if (selected !== this.localSelected) {
      this.localSelected = selected;
    }
  }
}
</script>

<style lang="scss">
.sidebar {
  flex: 0 20em;
  display: flex;
  flex-direction: column;
  color: var(--color);
  background-color: var(--background);
  overflow-y: auto;

  > ul {
    flex: 1;
    overflow: auto;
    margin: 0;
    padding: 0;

    > li {
      list-style: none;
      margin: 1em;
      padding: 1em;
      border-radius: 0.5em;
      background-color: var(--background-slight);

      &.selected {
        background-color: var(--background-strong);
      }
    }
  }
}
</style>
