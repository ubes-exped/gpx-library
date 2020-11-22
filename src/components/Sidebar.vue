<template>
  <div class="sidebar" :class="{ minimised }">
    <div class="top-box">
      <div class="controls">
        <label class="sort">
          Sort:
          <select v-model="sortType">
            <option value="+distance">Most distance</option>
            <option value="-distance">Least distance</option>
            <option value="+ascent">Most ascent</option>
            <option value="-ascent">Least ascent</option>
          </select>
        </label>
        <label class="sort">
          Filter:
          <select v-model="tagFilter">
            <option value="">Show all</option>
            <option disabled></option>
            <option v-for="tag in allTags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
        </label>
      </div>
      <a href="https://ubes.co.uk" target="_blank">
        <img class="logo" src="/ubes-logo.svg" />
      </a>
    </div>
    <div class="minimised-message map">
      <p><Icon>map</Icon></p>
      <p>Map</p>
    </div>
    <div class="minimised-message">
      <p><Icon>arrow_back</Icon></p>
      <p>Back</p>
    </div>
    <ul>
      <li
        v-for="walk of filteredWalks"
        :key="walk.index"
        :class="[
          'walk',
          { selected: selected && walk.index === selected.index }
        ]"
        @click="select(walk)"
      >
        <h3>{{ walk.name }}</h3>
        <p class="stats">
          ↔︎ {{ walk.distance.toFixed(1) }} km, ↗︎
          {{ walk.ascent.toFixed(0) }} m
        </p>
        <div class="details" v-if="selected && walk.index === selected.index">
          <div
            v-html="walk.elevationGraph"
            @mousemove="graphHover.send(walk, $event)"
            @mouseleave="graphHover.clear()"
          />
          <p>
            Created by <cite>{{ walk.author }}</cite>
          </p>
          <p>{{ walk.description }}</p>
          <div class="tags">
            <span
              class="tag"
              v-for="tag of walk.tags"
              :key="tag"
              @click="tagFilter = tag"
            >
              {{ tag }}
            </span>
          </div>
          <p class="download">
            <a :href="walk.href" download>
              GPX
              <icon inline large>get_app</icon>
            </a>
          </p>
        </div>
      </li>
    </ul>
    <div class="info" @click="showHelp">
      <span class="copy">UBES 2020</span>
      <span class="link-text">Help/About</span>
    </div>
    <div
      class="overlay"
      @click="minimised = !minimised"
      @wheel="minimised = true"
    />
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
import Icon from "./Icon.vue";

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

@Component({
  components: { Icon }
})
export default class Sidebar extends Vue {
  @Prop({ default: () => [] }) walks!: Walk[];

  @Prop({ default: null }) selected!: Walk | null;

  localSelected: number | null = this.selected?.index ?? null;

  sortType = "-distance";
  tagFilter = "";

  minimised = false;

  select(walk: Walk | null) {
    if (walk?.index === this.selected?.index) return;

    this.localSelected = walk?.index ?? null;

    if (walk) this.$router.replace({ name: "Walk", params: { id: walk.id } });
    else this.$router.replace({ name: "MapView" });
  }

  get sortedWalks(): Walk[] {
    const direction = this.sortType[0] === "-" ? 1 : -1;
    const field = this.sortType.slice(1) as KeysByType<Walk, number>;
    return this.walks.sort((a, b) => direction * (a[field] - b[field]));
  }

  get filteredWalks(): Walk[] {
    if (!this.tagFilter) return this.sortedWalks;
    let foundSelected = false;
    const filtered = this.sortedWalks.filter(walk =>
      walk.tags?.includes(this.tagFilter)
    );
    if (
      this.selected &&
      !filtered.find(walk => walk.index === this.selected?.index)
    ) {
      this.select(null);
    }
    return filtered;
  }

  /**
   * Get all the tags, sorted in alphabetical order
   */
  get allTags() {
    return Array.from(
      new Set(this.walks.flatMap(walk => walk.tags ?? []))
    ).sort((a, b) => a.localeCompare(b));
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

  showHelp() {
    this.$router.push({ name: "About" });
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
  transition: margin var(--transition-speed);
  z-index: 1;
  position: relative;

  > ul {
    flex: 1;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    background-color: var(--background);
    transition: margin var(--transition-speed);

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

      .tags {
        .tag {
          display: inline-block;
          margin: 0.1em;
          padding: 0.1em 0.2em;
          border-radius: 0.3em;
          border: 1px solid gray;
          font-size: 0.9em;
          background-color: var(--background-slight);
          cursor: pointer;
        }
      }

      .download {
        text-align: right;

        a {
          color: var(--color) !important;
          text-decoration: none;
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
    max-height: 100%;
    max-width: $sidebar-width - 2em;
    transition: max-width var(--transition-speed);
  }

  > .controls {
    padding: 0;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .sort {
      display: flex;
      align-items: center;
      margin: 1ex 0;

      select {
        flex-shrink: 1;
        min-width: 0;
        margin-left: 0.5ex;

        @media (hover: none) {
          font-size: 16px;
        }
      }
    }
  }
}

.info {
  text-align: center;
  font-size: 0.8em;
  padding: 1ex;
  cursor: pointer;

  .copy {
    &::before {
      content: "© ";
    }
    &::after {
      content: " • ";
    }
  }

  .link-text {
    text-decoration: underline;
  }
}

.overlay {
  display: none;
  cursor: pointer;
}

.minimised-message {
  height: 5em;
  background: var(--background);
  width: 5em;
  display: flex;
  margin-bottom: -5em;
  flex-direction: column;
  justify-content: space-evenly;
  margin-left: auto;
  text-align: center;
  transition: margin var(--transition-speed);

  p {
    margin: 0 1em;
  }

  &.map {
    border-radius: 0 1em 1em 0;
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

    &:not(.minimised) .minimised-message.map {
      margin-right: -5em;
    }
  }
}
</style>
