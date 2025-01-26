<script lang="ts">
import * as mapboxgl from 'mapbox-gl';
import type { PointOnLine } from '@/interfaces/Point';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useCssModule, watch } from 'vue';
import {
  addLayersToMap,
  applyWalks,
  greaterBounds,
  mapboxToken,
  MapSourceLayer,
  useMapSelection,
} from '@/utils/map';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'vue-router';
import { addOsAttribution, osKey, overrideOsMap, ukBounds } from '@/utils/os-map';
import MaterialIcon from './MaterialIcon.vue';
import { MapStyle, useMapStyle } from '@/utils/map-style';

declare global {
  interface Window {
    cachedMapElement?: mapboxgl.Map;
  }
}

const mapStyleUrls: Record<MapStyle, string> = {
  [MapStyle.OS_MAP]: 'https://api.os.uk/maps/vector/v1/vts/resources/styles?srs=3857&key=' + osKey,
  [MapStyle.MAPBOX]: '/mapbox-style.json',
};
</script>

<script setup lang="ts">
import polyline from '@mapbox/polyline';
import type Walk from '@/interfaces/Walk';

const center = defineModel<mapboxgl.LngLatLike>('center');
const zoom = defineModel<number>('zoom');
const selected = defineModel<string>('selected');

const { walks = [], hoveredPoint } = defineProps<{
  hoveredPoint?: PointOnLine;
  walks?: Walk[];
}>();

const selectedWalks = computed(() => walks.filter((walk) => walk.id === selected.value));

const router = useRouter();

const style = useCssModule();

const container = ref<HTMLDivElement>();

const { mapStyle, nextMapStyle } = useMapStyle();

const makeMarker = () => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<svg class="${style.arrow}" viewBox="0 0 500 800">
    <polygon points="100,400 200,400 250,300 300,400 400,400 250,100" class="${style.triangle}" />
  </svg>`;
  return wrapper;
};

if (!window.cachedMapElement) {
  const newMap = new mapboxgl.Map({
    accessToken: mapboxToken,
    container: document.createElement('div'),
    style: mapStyleUrls[mapStyle.value],
    center: center.value,
    zoom: zoom.value,
    maxZoom: 16 * (1 - Number.EPSILON),
  });

  newMap.addControl(new mapboxgl.FullscreenControl({ container: document.body }), 'top-right');
  newMap.addControl(
    new mapboxgl.NavigationControl({ showZoom: false, visualizePitch: true }),
    'top-right',
  );

  newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

  window.cachedMapElement = newMap;
}
const map = window.cachedMapElement;

const topRight = map.getContainer().querySelector(`.mapboxgl-ctrl-top-right`);
const bottomLeft = map.getContainer().querySelector(`.mapboxgl-ctrl-bottom-left`);

const resize = () => {
  map.resize();
  if (mapStyle.value === MapStyle.OS_MAP) {
    const newBounds = greaterBounds(ukBounds, map);
    map.setMaxBounds(newBounds);
  } else {
    map.setMaxBounds(null as never); // Remove the max bounds
  }
};

onMounted(() => {
  container.value?.appendChild(map.getContainer());
  resize();
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

map.on('dblclick', (ev) => {
  dblclick(ev);
});

const osMapSourcedataHandler = (e: mapboxgl.MapSourceDataEvent) => {
  if (e.sourceId === 'esri') {
    map.off('sourcedata', osMapSourcedataHandler);
    overrideOsMap(map);
  }
};

watch(mapStyle, (mapStyle) => {
  map.setStyle(mapStyleUrls[mapStyle]);
});

watch(
  mapStyle,
  (mapStyle) => {
    map.once('style.load', () => {
      mapLoaded(map);

      if (mapStyle === MapStyle.OS_MAP) {
        overrideOsMap(map);
      }
    });

    if (mapStyle === MapStyle.OS_MAP) {
      map.on('sourcedata', osMapSourcedataHandler);
    } else {
      map.off('sourcedata', osMapSourcedataHandler);
    }
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener('transitionend', resize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('transitionend', resize);
});

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
  resize();
  addOsAttribution(map);
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
  emitUpdate: (newSelected) => {
    if (newSelected) void router.replace({ name: 'Walk', params: { id: newSelected } });
    else void router.replace({ name: 'MapPage' });
  },
});

function dblclick(e: mapboxgl.MapMouseEvent) {
  if (selected.value) {
    e.preventDefault();
    void nextTick(flyToSelection);
  }
}

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
  <Teleport :to="bottomLeft">
    <a
      v-if="mapStyle === MapStyle.OS_MAP"
      href="https://www.ordnancesurvey.co.uk/"
      target="_blank"
      :class="['mapboxgl-ctrl', $style.osLogo]"
    ></a>
  </Teleport>
  <Teleport :to="topRight">
    <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
      <button @click="nextMapStyle">
        <MaterialIcon>layers</MaterialIcon>
      </button>
    </div>
  </Teleport>
</template>

<style lang="scss" module>
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

.osLogo {
  width: 90px;
  height: 24px;
  background-image: url(https://labs.os.uk/public/os-api-branding/v0.3.1/img/os-logo-maps.svg);
  // background-image: url(https://labs.os.uk/public/os-api-branding/v0.3.1/img/os-logo-maps-white.svg);
  background-size: 90px 24px;
  background-position: center;
  background-repeat: no-repeat;
  box-sizing: content-box;
}

:global(.mapboxgl-ctrl-bottom-right) {
  margin-left: 100px;
}
</style>
