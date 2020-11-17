<template>
  <div class="sidebar">
    <ul>
      <li
        v-for="walk of walks"
        :key="walk.id"
        :style="[walk.id === selected && { color: 'green' }]"
      >
        <h2>{{ walk.name }}</h2>
        <p>{{ walk.distance }} km, {{ walk.elevation }} m</p>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {
  Component, Vue, PropSync, Prop, Watch,
} from 'vue-property-decorator';
import Walk from '@/interfaces/Walk';

@Component({
  components: {},
})
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

<style scoped>
.sidebar {
  flex: 0 20em;
  display: flex;
  flex-direction: column;
  color: var(--color);
  background-color: var(--background);
}

.sidebar > ul {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 0 0 1em;
  word-break: break-all;
}
</style>
