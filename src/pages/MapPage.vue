<script setup lang="ts">
import HelpModal from '@/components/HelpModal.vue';
import SidebarContent from '@/components/SidebarContent.vue';
import UploadModal from '@/components/UploadModal.vue';
import type { Point, PointOnLine } from '@/interfaces/Point';
import type Walk from '@/interfaces/Walk';

import { tagComparator } from '@/utils/comparators';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const {
  walks,
  selectedHash,
  filterFromUrl,
  redirectToFilter = false,
  showHelp = false,
  showUpload = false,
} = defineProps<{
  walks?: Walk[];
  selectedHash?: string;
  filterFromUrl?: string;
  redirectToFilter?: boolean;
  showHelp?: boolean;
  showUpload?: boolean;
}>();

const router = useRouter();
const route = useRoute();

const location = ref<Point>({ lat: 51.45, lng: -2.6 });

const selected = ref<string>();

const zoom = ref(10);

const tagFilter = ref('');

watch(
  () => filterFromUrl,
  () => {
    if (filterFromUrl !== undefined) {
      tagFilter.value = filterFromUrl;
    }
  },
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
  if (!tagFilter.value) return walks ?? [];

  return walks?.filter((walk) => walk.tags?.includes(tagFilter.value)) ?? [];
});

watch(filteredWalks, (filtered) => {
  if (selected.value && !filtered.find((walk) => walk.id === selected.value)) {
    selected.value = undefined;
  }
});

const allTags = computed(
  () => walks && Array.from(new Set(walks.flatMap((walk) => walk.tags ?? []))).sort(tagComparator),
);

const hoveredPoint = ref<PointOnLine>();

const updateFilter = async (filter: string) => {
  tagFilter.value = filter;
  if (filterFromUrl !== undefined) await performRedirectToFilter();
};

watch(
  () => [selectedHash, walks],
  () => {
    if (selectedHash && walks?.some((walk) => walk.id === selectedHash)) {
      selected.value = selectedHash;
    } else {
      selected.value = undefined;
    }
  },
  { immediate: true },
);

const MapView = defineAsyncComponent(() =>
  import('@/components/MapView.vue')
)
</script>

<template>
  <div :class="$style.mapPage">
    <SidebarContent
      :walks="filteredWalks"
      :selected="selected"
      :all-tags="allTags"
      :filter="tagFilter"
      @update:filter="updateFilter"
      @hover-point="hoveredPoint = $event"
    />
    <MapView
      v-model:center="location"
      v-model:zoom="zoom"
      v-model:selected="selected"
      :walks="filteredWalks"
      :hovered-point="hoveredPoint"
    />
    <HelpModal v-if="showHelp" />
    <UploadModal v-if="showUpload" />
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
