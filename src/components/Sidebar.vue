<template>
  <div
    class="sidebar"
    :class="{ minimised }"
  >
    <div class="top-box">
      <div class="controls">
        <label class="control">
          Sort:
          <Dropdown
            v-model="sortType"
            class="select-wrapper"
            :options="sortOptions"
          />
        </label>
        <label
          v-if="useTags"
          class="control"
        >
          Filter:
          <Dropdown
            v-model="tagFilter"
            blank-value=""
            blank-label="Show all"
            class="dropdown"
            :options="allTags.map(tag => ({ value: tag, label: tag }))"
            clear-button
          />
        </label>
      </div>
      <a
        href="https://ubes.co.uk"
        target="_blank"
      >
        <img
          class="logo"
          src="/ubes-logo.svg"
        >
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
        v-for="walk of sortedWalks"
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
        <div
          v-if="selected && walk.index === selected.index"
          class="details"
        >
          <div
            @mousemove="graphHover.send(walk, $event)"
            @mouseleave="graphHover.clear()"
            v-html="walk.elevationGraph"
          />
          <p v-if="walk.author">
            Created by <cite>{{ walk.author }}</cite>
          </p>
          <p>{{ walk.description }}</p>
          <div
            v-if="useTags"
            class="tags"
          >
            <span
              v-for="tag of walk.tags"
              :key="tag"
              class="tag"
              @click="tagFilter = tag"
            >
              {{ tag }}
            </span>
          </div>
          <p class="download">
            <a
              :href="walk.href"
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
      <li
        v-if="tagFilter"
        class="dummy"
      >
        <p>
          Only showing routes tagged as <span class="tag">{{ tagFilter }}</span>
        </p>
        <button @click="tagFilter = ''">
          Show all
        </button>
      </li>
    </ul>
    <router-link
      class="info"
      :to="{ name: 'About' }"
    >
      <span class="copy">UBES 2020</span>
      <span class="link-text">Help/About</span>
    </router-link>
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
  Emit,
} from "vue-property-decorator";
import Walk from "@/interfaces/Walk";
import Icon from "./Icon.vue";
import Dropdown from "./Dropdown.vue";

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
  wait = 100,
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

  const send = (...args: T) => {
    if (!timeout) callAndTimeout(...args);
    else cachedArgs = args;
  };

  const clear = () => {
    clearTimeout(timeout);
    timeout = undefined;
    cachedArgs = undefined;
    onClear?.();
  };

  return { send, clear };
}

@Component({
  components: { Icon, Dropdown },
})
export default class Sidebar extends Vue {
  @Prop({ default: () => [] }) walks!: Walk[];

  @Prop({ default: null }) selected!: Walk | null;

  @Prop(Boolean) useTags!: boolean;

  localSelected: number | null = this.selected?.index ?? null;

  sortType = "-distance";

  sortOptions = [
    { value: "+distance", label: "Most distance" },
    { value: "-distance", label: "Least distance" },
    { value: "+ascent", label: "Most ascent" },
    { value: "-ascent", label: "Least ascent" },
  ];

  @PropSync("filter", { default: "" }) tagFilter!: string;

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

  @Prop({ default: undefined }) allTags?: string[];

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
    () => this.hoverPoint(),
  );
}
</script>

<style lang="scss">
@use 'src/styles/tablet';
@use 'src/styles/bidi';

$max-sidebar-width: calc(100vw - 6rem);
$sidebar-width: 25rem;

$minimised-width: 5rem;

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

    > * {
      list-style: none;
      margin: 1em;
      padding: 1em;
      border-radius: 0.5em;
      background-color: var(--background-slight);

      &.walk {
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

      &.dummy {
        display: flex;
        flex-direction: column;
        align-items: flex-end;

        .tag {
          @include tablet.full;
        }

        p {
          margin: 0 0 0.5em;
          align-self: stretch;
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

  a {
    display: contents;
  }

  .logo {
    filter: #{invert }(var(--invert));
    align-self: stretch;
    max-height: 100%;
    max-width: #{"min" }(20vw, $sidebar-width - 2rem);
    transition: max-width var(--transition-speed),
      margin var(--transition-speed);
    margin-inline-start: 0;
  }

  > .controls {
    padding: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .control {
      display: flex;
      align-items: center;
      min-width: 0;
    }
  }
}

.info {
  text-align: center;
  font-size: 0.8em;
  padding: 1ex;
  cursor: pointer;
  color: inherit;
  text-decoration: inherit;

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
  height: 5rem;
  background: var(--background);
  width: $minimised-width;
  display: flex;
  margin-bottom: -5rem;
  flex-direction: column;
  justify-content: space-evenly;
  margin-inline-start: auto;
  text-align: center;
  transition: margin var(--transition-speed);

  p {
    margin: 0 1em;
  }

  &.map {
    @include bidi.border-radius(0, 1em);
    position: relative;
    z-index: -1;

    &::before,
    &::after {
      position: absolute;
      content: "";
      height: 2em;
      @include bidi.property(left, right, 0);
      width: 1em;
      background-color: transparent;
    }
    &::before {
      bottom: 100%;
      box-shadow: 0 1em 0 0 var(--background);
      @include bidi.property(
        border-bottom-left-radius,
        border-bottom-right-radius,
        1em
      );
    }
    &::after {
      top: 100%;
      box-shadow: 0 -1em 0 0 var(--background);
      @include bidi.property(
        border-top-left-radius,
        border-top-right-radius,
        1em
      );
    }
  }
}

@media screen and (max-width: 600px) {
  .overlay {
    display: block;
    position: absolute;
    z-index: 2;
    @include bidi.property(left, right, 100%);
    top: 0;
    bottom: 0;
    width: 100vw;
  }

  .sidebar {
    $sidebar-overlap-fallback: -20rem;
    $sidebar-overlap: calc(
      #{$minimised-width} - min(#{$sidebar-width}, #{$max-sidebar-width})
    );

    margin-inline-end: $sidebar-overlap-fallback;
    margin-inline-end: $sidebar-overlap;

    &.minimised {
      margin-inline-start: $sidebar-overlap-fallback;
      margin-inline-start: $sidebar-overlap;
      margin-inline-end: 0;

      > ul {
        margin-inline-start: -$minimised-width;
        margin-inline-end: $minimised-width;
      }

      .top-box .logo {
        $minimised-padding: 1rem;

        margin-inline-start: $minimised-padding;
        max-width: $minimised-width - 2 * $minimised-padding;
      }

      .overlay {
        @include bidi.property(right, left, 0);
        @include bidi.property(left, right, unset);
      }

      .info {
        margin-inline-end: $minimised-width;
      }
    }

    &:not(.minimised) .minimised-message.map {
      margin-inline-end: -$minimised-width;
    }
  }
}
</style>
