<script setup lang="ts">
import type { PointOnLine } from '@/interfaces/Point';
import type Walk from '@/interfaces/Walk';
import type { KeysByType } from '@/typings/KeysByType';
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import MaterialIcon from './MaterialIcon.vue';
import DropdownControl from './DropdownControl.vue';
import SidebarWalk from './SidebarWalk.vue';

const { walks, selected } = defineProps<{
  walks: Walk[] | undefined;
  selected?: string;
  allTags?: string[];
}>();

const emit = defineEmits<{ hoverPoint: [point: PointOnLine | undefined] }>();

const router = useRouter();

const tagFilter = defineModel<string>('filter', { default: '' });

let localSelected = selected;

const sortOptions = [
  { value: '+distance', label: 'Most distance' },
  { value: '-distance', label: 'Least distance' },
  { value: '+ascent', label: 'Most ascent' },
  { value: '-ascent', label: 'Least ascent' },
] as const;

const sortType = ref<string>('-distance');

const minimised = ref(false);

const select = async (walk: Walk | null) => {
  if (walk?.id === selected) return;

  localSelected = walk?.id;

  if (walk) await router.replace({ name: 'Walk', params: { id: walk.id } });
  else await router.replace({ name: 'MapPage' });
};

const sortedWalks = computed(() => {
  const direction = sortType.value.startsWith('-') ? 1 : -1;
  const field = sortType.value.slice(1) as KeysByType<Walk, number>;
  return walks?.slice().sort((a, b) => direction * (a[field] - b[field])) ?? [];
});

const sidebarItemListRef = ref<HTMLElement>();

watch(
  () => selected,
  async (selected) => {
    if (selected === localSelected) return;

    localSelected = selected;
    if (selected) minimised.value = false;
    await nextTick();
    const el = sidebarItemListRef.value?.querySelector('.selected');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
);
</script>

<template>
  <div :class="[$style.sidebar, minimised && $style.minimised]">
    <div :class="$style.topBox">
      <div :class="$style.controls">
        <label :class="$style.control">
          Sort:
          <DropdownControl v-model="sortType" :options="sortOptions" />
        </label>
        <label :class="$style.control">
          Filter:
          <!-- TODO: add loading indicator when no filters -->
          <DropdownControl
            v-model="tagFilter"
            blank-value=""
            blank-label="Show all"
            :class="$style.dropdownControl"
            :options="allTags?.map((tag) => ({ value: tag, label: tag })) ?? []"
            clear-button
          />
        </label>
      </div>
      <a href="https://ubes.co.uk" target="_blank">
        <img :class="$style.logo" src="/ubes-logo.svg" />
      </a>
    </div>
    <div :class="[$style.minimisedMessage, $style.map]">
      <p><MaterialIcon>map</MaterialIcon></p>
      <p>Map</p>
    </div>
    <div :class="$style.minimisedMessage">
      <p><MaterialIcon>arrow_back</MaterialIcon></p>
      <p>Back</p>
    </div>
    <ul ref="sidebarItemListRef">
      <SidebarWalk
        v-for="walk of sortedWalks"
        :key="walk.id"
        :walk="walk"
        :selected="selected !== undefined && walk.id === selected"
        @select="select(walk)"
        @hover-point="emit('hoverPoint', $event)"
        @set-tag-filter="tagFilter = $event"
      />
      <li v-if="tagFilter" :class="$style.dummy">
        <p>
          Only showing routes tagged as <span :class="$style.tag">{{ tagFilter }}</span>
        </p>
        <button @click="tagFilter = ''">Show all</button>
      </li>
    </ul>
    <div :class="$style.info">
      <router-link :to="{ name: 'About' }">
        <span :class="$style.copy">UBES 2025</span>
        <span :class="$style.linkText">Help/About</span>
      </router-link>
      <router-link :to="{ name: 'Upload' }">
        <span :class="$style.linkText">Contribute</span>
      </router-link>
    </div>
    <div :class="$style.overlay" @click="minimised = !minimised" @wheel="minimised = true" />
  </div>
</template>

<style lang="scss" module>
@use '@/styles/tablet';
@use '@/styles/bidi';

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

.topBox {
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
    max-width: #{'min' }(20vw, $sidebar-width - 2rem);
    transition:
      max-width var(--transition-speed),
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

  > a {
    display: contents;
    cursor: pointer;
    color: inherit;
    text-decoration: inherit;
  }

  .copy {
    &::before {
      content: '© ';
    }
    &::after {
      content: ' • ';
    }
  }

  > a:not(:last-child)::after {
    content: ' • ';
  }

  .linkText {
    text-decoration: underline;
  }
}

.overlay {
  display: none;
  cursor: pointer;
}

.minimisedMessage {
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
      content: '';
      height: 2em;
      @include bidi.property(left, right, 0);
      width: 1em;
      background-color: transparent;
    }
    &::before {
      bottom: 100%;
      box-shadow: 0 1em 0 0 var(--background);
      @include bidi.property(border-bottom-left-radius, border-bottom-right-radius, 1em);
    }
    &::after {
      top: 100%;
      box-shadow: 0 -1em 0 0 var(--background);
      @include bidi.property(border-top-left-radius, border-top-right-radius, 1em);
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
    $sidebar-overlap: calc(#{$minimised-width} - min(#{$sidebar-width}, #{$max-sidebar-width}));

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

      .topBox .logo {
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

    &:not(.minimised) .minimisedMessage.map {
      margin-inline-end: -$minimised-width;
    }
  }
}
</style>
