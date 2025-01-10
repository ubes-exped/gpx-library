<script setup lang="ts">
import HelpModal from '@/components/HelpModal.vue';
import SidebarContent from '@/components/SidebarContent.vue';
import UploadModal from '@/components/UploadModal.vue';
import type { Point, PointOnLine } from '@/interfaces/Point';
import type Walk from '@/interfaces/Walk';

import { tagComparator } from '@/utils/comparators';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const walks = defineModel<Walk[]>('walks')

const {
  /** selectedHash is null when nothing is selected, and undefined when the URL does not determine the selection */
  selectedHash,
  filterFromUrl,
  redirectToFilter,
  showHelp,
  showUpload,
  lockFilter,
  lockContributions,
  showFullLink,
} = defineProps<{
  selectedHash?: string | null;
  filterFromUrl?: string;
  redirectToFilter?: boolean;
  showHelp?: boolean;
  showUpload?: boolean;
  lockFilter?: boolean;
  lockContributions?: boolean;
  showFullLink?: boolean;
}>();

const router = useRouter();
const route = useRoute();

const parseNumberFromUrl = (queryField: string, fallback: number) => {
  const value = route.query[queryField];
  if (typeof value !== 'string') return fallback;
  const parsedValue = parseFloat(value);
  if (isNaN(parsedValue)) return fallback;
  return parsedValue;
};

const location = ref<Point>({
  lat: parseNumberFromUrl('lat', 51.45),
  lng: parseNumberFromUrl('lng', -2.6),
});

const selected = ref<string>();

const zoom = ref(parseNumberFromUrl('z', 10));

const tagFilter = ref('');

watch(
  () => filterFromUrl,
  () => {
    if (filterFromUrl !== undefined) {
      tagFilter.value = filterFromUrl;
    }
  },
  { immediate: true },
);

watch(
  () => redirectToFilter,
  async () => {
    if (redirectToFilter) await performRedirectToFilter();
  },
);

const performRedirectToFilter = () =>
  router.replace({
    name: tagFilter.value ? 'Filter' : 'MapPage',
    params: { ...route.params, filter: tagFilter.value },
  });

const filteredWalks = computed(() => {
  if (!tagFilter.value) return walks.value ?? []; 

  return walks.value?.filter((walk) => walk.tags?.includes(tagFilter.value)) ?? [];
});

watch(filteredWalks, (filtered) => {
  if (selected.value && !filtered.find((walk) => walk.id === selected.value)) {
    selected.value = undefined;
  }
});

const allTags = computed(
  () => walks.value && Array.from(new Set(walks.value.flatMap((walk) => walk.tags ?? []))).sort(tagComparator),
);

const allAuthors = computed<string[] | undefined>(
  () =>
    walks.value &&
    Array.from(new Set(walks.value.map((walk) => walk.author)))
      .filter((author): author is string => !!author)
      .sort(),
);

const hoveredPoint = ref<PointOnLine>();

const updateFilter = async (filter: string) => {
  tagFilter.value = filter;
  if (filterFromUrl !== undefined) await performRedirectToFilter();
};

watch(
  () => [selectedHash, walks],
  () => {
    if (selectedHash && walks.value?.some((walk) => walk.id === selectedHash)) {
      selected.value = selectedHash;
    } else if (selectedHash !== undefined) {
      selected.value = undefined;
    }
  },
  { immediate: true },
);

const MapView = defineAsyncComponent(() => import('@/components/MapView.vue'));
</script>

<template>
  <div :class="$style.mapPage">
    <SidebarContent
      :walks="filteredWalks"
      :selected="selected"
      :all-tags="allTags"
      :filter="tagFilter"
      :lockFilter="lockFilter"
      :lockContributions="lockContributions"
      :showFullLink="showFullLink"
      @update:filter="updateFilter"
      @hover-point="hoveredPoint = $event"
    />
    <MapView
      v-model:center="location"
      v-model:zoom="zoom"
      v-model:selected="selected"
      v-model:walks="filteredWalks"
      :hovered-point="hoveredPoint"
    />
    <HelpModal v-if="showHelp" :lockFilter="lockFilter" />
    <UploadModal v-if="showUpload" :all-tags="allTags" :all-authors="allAuthors" @reloadWalks="walks = $event" />
  </div>
</template>

<style module>
.mapPage {
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
}
</style>
