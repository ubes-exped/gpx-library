<script lang="ts">
import * as mapboxgl from 'mapbox-gl';
import type { PointOnLine } from '@/interfaces/Point';
import { computed, onBeforeUnmount, onMounted, ref, useCssModule, watch } from 'vue';
import { addLayersToMap, applyWalks, MapSourceLayer, useMapSelection } from '@/utils/map';
import 'mapbox-gl/dist/mapbox-gl.css';

declare global {
  interface Window {
    cachedMapElement?: mapboxgl.Map;
  }
}

const token =
  'pk.eyJ1IjoiY2hhcmRpbmciLCJhIjoiY2tocjJpcW5wMGYyOTJydDBicTZvam8xcCJ9.ZJfnHJE_5dJNCsEsQCrwJw';
</script>

<script setup lang="ts">
import polyline from '@mapbox/polyline';
import type Walk from '@/interfaces/Walk';

const style = useCssModule();

const center = defineModel<mapboxgl.LngLatLike>('center');
const zoom = defineModel<number>('zoom');
const selected = defineModel<string>('selected');

const { walks = [], hoveredPoint } = defineProps<{
  hoveredPoint?: PointOnLine;
  walks?: Walk[];
}>();

const selectedWalks = computed(() => walks.filter((walk) => walk.id === selected.value));

const container = ref<HTMLDivElement>();
const mapStyle = ref('mapbox://styles/charding/ckhr4mjb11o5n19ke1n26cv1c');

const makeMarker = () => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<svg class="${style.arrow}" viewBox="0 0 500 800">
    <polygon points="100,400 200,400 250,300 300,400 400,400 250,100" class="${style.triangle}" />
  </svg>`;
  return wrapper;
};

if (!window.cachedMapElement) {
  const newMap = new mapboxgl.Map({
    accessToken: token,
    container: document.createElement('div'),
    style: mapStyle.value,
    center: center.value,
    zoom: zoom.value,
  });

  newMap.addControl(new mapboxgl.FullscreenControl({ container: document.body }), 'top-right');
  newMap.addControl(
    new mapboxgl.NavigationControl({ showZoom: false, visualizePitch: true }),
    'bottom-left',
  );

  newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

  window.cachedMapElement = newMap;
}
const map = window.cachedMapElement;

onMounted(() => {
  container.value?.appendChild(map.getContainer());
  map.resize();
});

map.on('zoomend', () => {
  zoomend(map);
});
map.on('moveend', () => {
  moveend(map);
});
map.on('click', (ev) => {
  click(ev);
});
map.once('idle', () => {
  mapLoaded(map);
});

const resizeHandler = () => map.resize();

onMounted(() => {
  window.addEventListener('transitionend', resizeHandler, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('transitionend', resizeHandler);
});

watch(mapStyle, (style) => map.setStyle(style));

watch(
  () => walks,
  (walks) => {
    applyWalks(map, walks, MapSourceLayer.LINES);
  },
);
watch(selectedWalks, (selectedWalks) => {
  applyWalks(map, selectedWalks, MapSourceLayer.SELECTED);
});

const mapLoaded = (map: mapboxgl.Map) => {
  map.resize();

  addLayersToMap(map);

  applyWalks(map, walks, MapSourceLayer.LINES);
  applyWalks(map, selectedWalks.value, MapSourceLayer.SELECTED);
};

const zoomend = (map: mapboxgl.Map): void => {
  zoom.value = map.getZoom();
};

const moveend = (map: mapboxgl.Map): void => {
  center.value = map.getCenter();
};

const flyToSelection = () => {
  if (!selectedWalks.value.length) return;
  const walk = selectedWalks.value[0];

  const padding = 50;

  const coordinates = polyline.decode(walk.polyline).map<[number, number]>(([y, x]) => [x, y]);
  const bounds = coordinates.reduce(
    (acc, coord) => acc.extend(coord),
    new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
  );
  map.fitBounds(bounds, { padding, maxZoom: 20 });
};

const { click } = useMapSelection({
  getExternalSelection: () => selected.value,
  flyToSelection,
  emitUpdate: (newSelected) => (selected.value = newSelected),
});

const hoveredMarker = new mapboxgl.Marker(makeMarker());

watch(
  () => hoveredPoint,
  (point) => {
    if (!point) {
      hoveredMarker.remove();
    } else {
      hoveredMarker.setLngLat([point.lng, point.lat]);
      const arrow = hoveredMarker.getElement().querySelector<HTMLElement>(`.${style.arrow}`);
      if (!arrow) return;
      arrow.style.transform = `rotate(${String(point.bearing)}deg)`;
      hoveredMarker.addTo(map);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div ref="container" :class="$style.mapContainer"></div>
</template>

<style lang="scss" module>
@import 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' layer(mapbox);

.mapContainer {
  display: contents;

  :global(.mapboxgl-map) {
    flex: 1;
    z-index: 0;

    :global(.mapboxgl-canvas) {
      cursor: pointer;
    }
  }

  .arrow {
    width: 3em;
  }

  .triangle {
    fill: #f00;
    stroke: white;
    stroke-width: 20;
  }
}
</style>
