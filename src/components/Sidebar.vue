<template>
  <div class="sidebar" :class="{ minimised }">
    <div class="top-box">
      <div class="controls">
        <p class="sort">
          Sort by:
          <select v-model="sortType">
            <option value="+distance">Most distance</option>
            <option value="-distance">Least distance</option>
            <option value="+ascent">Most ascent</option>
            <option value="-ascent">Least ascent</option>
          </select>
        </p>
      </div>
      <a href="https://ubes.co.uk" target="_blank">
        <img class="logo" src="/ubes-logo.svg" />
      </a>
    </div>
    <div class="minimised-message"><p>Back to the list</p></div>
    <ul>
      <li
        v-for="walk of sortedWalks"
        :key="walk.index"
        :class="['walk', { selected: walk.index === selected }]"
        @click="click(walk.index, $event)"
        @dblclick="forceSelect()"
      >
        <h3>{{ walk.name }}</h3>
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
    <div class="overlay" @click="minimised = !minimised" />
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

  minimised = false;

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

  @Watch("selected") async onSelected(selected: number | null) {
    if (selected !== this.localSelected) {
      this.localSelected = selected;
      if (selected) this.minimised = false;
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
$max-sidebar-width: 80vw;
$sidebar-width: 25em;

.sidebar {
  flex: 0 $sidebar-width;
  max-width: $max-sidebar-width;
  display: flex;
  flex-direction: column;
  color: var(--color);
  background-color: var(--background);
  transition: margin 0.5s;
  z-index: 1;
  position: relative;

  > ul {
    flex: 1;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    background-color: var(--background);
    transition: margin 0.5s;

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

      h3,
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
  padding: 2vh 1em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 10vh;

  // Prevent Sass complaining about invert
  @function invert($options...) {
    @return #{"invert(#{$options})"};
  }

  a {
    display: contents;
  }

  .logo {
    filter: invert(var(--invert));
    align-self: stretch;
    max-width: $sidebar-width - 2em;
    transition: max-width 0.5s;
  }

  > .controls {
    padding: 0 0;
    line-height: 5vh;
    text-align: left;
  }
}

.overlay {
  display: none;
  cursor: pointer;
}

.minimised-message {
  height: 0;
  overflow: visible;
  width: 5em;
  margin-left: auto;

  p {
    margin: 1em;
  }
}

@media screen and (max-width: 600px) {
  .overlay {
    display: block;
    position: absolute;
    z-index: 2;
    left: 100%;
    top: 0;
    bottom: 0;
    width: 100vw;
  }

  .sidebar {
    $sidebar-overlap-fallback: -20em;
    $sidebar-overlap: calc(5em - min(#{$sidebar-width}, #{$max-sidebar-width}));

    margin-right: $sidebar-overlap-fallback;
    margin-right: $sidebar-overlap;

    &.minimised {
      margin-left: $sidebar-overlap-fallback;
      margin-left: $sidebar-overlap;
      margin-right: 0;

      > ul {
        margin-left: -5em;
        margin-right: 5em;
      }

      .top-box .logo {
        max-width: 3em;
      }

      .overlay {
        right: 0;
        left: unset;
      }
    }
  }
}
</style>
