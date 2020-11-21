<template>
  <div class="sidebar">
    <div class="top-box">
      <ol class="controls">
        <li class="sort">
          Sort by:
          <select v-model="sortType">
            <option value="+distance">Most distance</option>
            <option value="-distance">Least distance</option>
            <option value="+ascent">Most ascent</option>
            <option value="-ascent">Least ascent</option>
          </select>
        </li>
      </ol>
      <a href="https://ubes.co.uk"><img src="/ubes-logo.svg"/></a>
    </div>
    <ul>
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
          <div
            v-html="walk.elevationGraph"
            @mousemove="graphHover.send(walk, $event)"
            @mouseleave="graphHover.clear()"
          />
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

// Find only the keys of an object with a given value type
// source: https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
type KeysByType<Object, ValueType> = Exclude<
  {
    [Key in keyof Object]: Object[Key] extends ValueType ? Key : never;
  }[keyof Object],
  undefined
>;

/**
 * Throttle a function, so it only gets called every `wait` ms
 *
 * The function gets called immediately if it hasn’t been called in the last `wait` ms.
 * Otherwise, it is called `wait` ms after it was last called, with the most recent values passed
 * to it.
 */
function throttle<T extends any[]>(
  func: (...args: T) => void,
  onClear?: () => void,
  wait = 100
) {
  let cachedArgs: T | undefined;
  let timeout: number | undefined;

  const callAndTimeout = (...args: T) => {
    func(...args);
    timeout = setTimeout(() => {
      if (cachedArgs) {
        callAndTimeout(...cachedArgs);
        cachedArgs = undefined;
      } else {
        timeout = undefined;
      }
    }, wait);
  };

  const send = function(...args: T) {
    if (!timeout) callAndTimeout(...args);
    else cachedArgs = args;
  };

  const clear = () => {
    clearTimeout(timeout);
    timeout = cachedArgs = timeout = undefined;
    onClear?.();
  };

  return { send, clear };
}

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

  @Emit("hover-point") hoverPoint(point?: { lat: number; long: number }) {
    return point;
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
    () => this.hoverPoint()
  );
}
</script>

<style lang="scss">
.sidebar {
  flex: 0 25em;
  display: flex;
  flex-direction: column;
  color: var(--color);
  background-color: var(--background);

  > ul {
    flex: 1;
    overflow-y: auto;
    margin: 0;
    padding: 0;

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

      .download {
        text-align: right;

        a {
          color: var(--color) !important;
        }
      }
    }
  }
}

.top-box {
  padding: 2vh 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-height: 10vh;

  // Prevent Sass complaining about invert
  @function invert($options...) {
    @return #{"invert(#{$options})"};
  }

  a {
    display:contents;
  }

  img {
    filter: invert(var(--invert));
    align-self:stretch;
  }

  > .controls {
    padding: 0 0;
    line-height: 5vh;
    text-align: left;
    list-style: none;
  }
}
</style>
