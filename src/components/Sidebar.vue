<template>
  <div class="sidebar">
    <div class="logo-box">UBES!</div>
    <ul>
      <li
        v-for="walk of walks"
        :key="walk.index"
        :class="{ selected: walk.index === selected }"
        @click="click(walk.index, $event)"
        @dblclick="forceSelect()"
      >
        <h2>{{ walk.name }}</h2>
        <p class="stats">
          ↔︎ {{ walk.distance.toFixed(1) }} km, ↗︎
          {{ walk.ascent.toFixed(0) }} m
        </p>
        <div class="details">
          <p>
            Created by <cite>{{ walk.author }}</cite>
          </p>
          <p>{{ walk.description }}</p>
          <p class="download">
            <a :href="walk.href" download>Download GPX</a>
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {
  Component,
  Vue,
  PropSync,
  Prop,
  Watch,
  Emit
} from "vue-property-decorator";
import Walk from "@/interfaces/Walk";

@Component
export default class Sidebar extends Vue {
  @Prop({ default: () => [] }) walks!: Walk[];

  @PropSync("selected", { default: () => null }) modelSelected!: number | null;

  localSelected?: number | null = this.modelSelected;

  click(id: number, e: MouseEvent) {
    if (e.detail > 1) return;
    this.select(id);
  }

  @Emit("update:selected")
  select(id: number) {
    return id;
  }

  @Emit("zoom-to-selected")
  forceSelect() {
    return this.modelSelected;
  }

  @Watch("selected") async onSelected(selected: number) {
    if (selected !== this.localSelected) {
      this.localSelected = selected;
      await this.$nextTick();
      const el = this.$el.querySelector(".selected");
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
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

  > ul {
    flex: 1;
    overflow-y: auto;
    margin: 0;
    padding: 0;

    > li {
      list-style: none;
      margin: 1em;
      padding: 1em;
      border-radius: 0.5em;
      background-color: var(--background-slight);
      cursor: pointer;
      display: flex;
      flex-direction: column;

      .details {
        display: none;
      }

      &.selected {
        background-color: var(--background-strong);
        cursor: unset;

        .details {
          display: unset;
        }
      }

      h2,
      p {
        margin: 0.25em 0;
      }

      .download {
        text-align: right;

        a {
          color: var(--color) !important;
        }
      }
    }
  }
}
</style>
