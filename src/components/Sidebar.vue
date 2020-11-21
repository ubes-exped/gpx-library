<template>
  <div class="sidebar">
    <div class="logo-box">
      <a href="https://ubes.co.uk"><img src="/ubes-logo.svg"/></a>
    </div>
    <ul>
      <li class="sort-control">
        Sort by:
        <select v-model="sortType">
          <option value="+distance">Most distance</option>
          <option value="-distance">Least distance</option>
          <option value="+ascent">Most ascent</option>
          <option value="-ascent">Least ascent</option>
        </select>
      </li>
      <li
        v-for="walk of sortedWalks"
        :key="walk.index"
        :class="['walk', { selected: walk.index === selected }]"
        @click="click(walk.index, $event)"
        @dblclick="forceSelect()"
      >
        <h2>{{ walk.name }}</h2>
        <p class="stats">
          ↔︎ {{ walk.distance.toFixed(1) }} km, ↗︎
          {{ walk.ascent.toFixed(0) }} m
        </p>
        <div class="details" v-if="walk.index === selected">
          <div v-html="walk.elevationGraph" />
          <p>
            Created by <cite>{{ walk.author }}</cite>
          </p>
          <div class="tags">
            <span class="tag" v-for="tag of walk.tags" :key="tag">{{
              tag
            }}</span>
          </div>
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

// Find only the keys of an object with a given value type
// source: https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
type KeysByType<Object, ValueType> = Exclude<
  {
    [Key in keyof Object]: Object[Key] extends ValueType ? Key : never;
  }[keyof Object],
  undefined
>;

@Component
export default class Sidebar extends Vue {
  @Prop({ default: () => [] }) walks!: Walk[];

  @PropSync("selected", { default: () => null }) modelSelected!: number | null;

  localSelected?: number | null = this.modelSelected;

  sortType = "-distance";

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

  get sortedWalks() {
    const direction = this.sortType[0] === "-" ? 1 : -1;
    const field = this.sortType.slice(1) as KeysByType<Walk, number>;
    return this.walks.sort((a, b) => direction * (a[field] - b[field]));
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

    > .sort-control {
      padding: 0 1em;
      text-align: center;
      list-style: none;
    }

    > .walk {
      list-style: none;
      margin: 1em;
      padding: 1em;
      border-radius: 0.5em;
      background-color: var(--background-slight);
      cursor: pointer;
      display: flex;
      flex-direction: column;

      &.selected {
        background-color: var(--background-strong);
        cursor: unset;
      }

      h2,
      p {
        margin: 0.25em 0;
      }

      .tags {
        .tag {
          display: inline-block;
          margin: 0.1em;
          padding: 0.1em 0.2em;
          border-radius: 0.3em;
          border: 1px solid gray;
          font-size: 0.9em;
          background-color: var(--background-slight);
        }
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

.logo-box {
  text-align: center;
  padding: 1em;

  // Prevent Sass complaining about invert
  @function invert($options...) {
    @return #{"invert(#{$options})"};
  }

  img {
    max-height: 20vh;
    height: 10em;
    filter: invert(var(--invert));
  }
}
</style>
