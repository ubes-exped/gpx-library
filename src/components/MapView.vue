<script lang="ts">
import * as maplibregl from 'maplibre-gl';
import type { PointOnLine } from '@/interfaces/Point';
import { computed, onBeforeUnmount, onMounted, ref, useCssModule, watch } from 'vue';
import {
  addLayersToMap,
  applyWalks,
  greaterBounds,
  MapSourceLayer,
  useMapSelection,
} from '@/utils/map';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'vue-router';
import { addOsAttribution, overrideOsMap, ukBounds } from '@/utils/os-map';

declare global {
  interface Window {
    cachedMapElement?: maplibregl.Map;
  }
}

const osKey = 'q6ygAjaocSqBV553jubhAFqd9o4yiczG';

class LinkControl implements maplibregl.IControl {
  constructor(
    private readonly href: string,
    private readonly className?: string,
    private readonly text?: string,
  ) {}

  onAdd() {
    const control = document.createElement('a');
    control.href = this.href;
    control.target = '_blank';
    control.classList.add('maplibregl-ctrl');
    if (this.className) control.classList.add(this.className);
    if (this.text) control.innerText = this.text;
    return control;
  }
  onRemove() {
    // no-op
  }
  getDefaultPosition(): maplibregl.ControlPosition {
    return 'bottom-left';
  }
}
</script>

<script setup lang="ts">
import polyline from '@mapbox/polyline';
import type Walk from '@/interfaces/Walk';

const center = defineModel<maplibregl.LngLatLike>('center');
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
const mapStyle = ref('https://api.os.uk/maps/vector/v1/vts/resources/styles?srs=3857&key=' + osKey);

const makeMarker = () => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<svg class="${style.arrow}" viewBox="0 0 500 800">
    <polygon points="100,400 200,400 250,300 300,400 400,400 250,100" class="${style.triangle}" />
  </svg>`;
  return wrapper;
};

if (!window.cachedMapElement) {
  const container = document.createElement('div');
  container.id = 'map-container';

  const newMap = new maplibregl.Map({
    container,
    style: mapStyle.value,
    center: center.value,
    zoom: zoom.value,
    maxZoom: 16 * (1 - Number.EPSILON),
  });

  newMap.addControl(new maplibregl.LogoControl({ compact: false }));
  newMap.addControl(new LinkControl('https://www.ordnancesurvey.co.uk/', style.osLogo));
  newMap.addControl(new maplibregl.FullscreenControl({ container: document.body }), 'top-right');
  newMap.addControl(
    new maplibregl.NavigationControl({ showZoom: false, visualizePitch: true }),
    'top-right',
  );

  newMap.addControl(new maplibregl.ScaleControl(), 'bottom-left');

  window.cachedMapElement = newMap;
}
const map = window.cachedMapElement;

const resize = () => {
  map.resize();
  const newBounds = greaterBounds(ukBounds, map);
  map.setMaxBounds(newBounds);
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
void map.once('style.load', () => {
  mapLoaded(map);
});

const sourcedataSubscription = map.on('sourcedata', (e) => {
  if (e.sourceId === 'esri' && e.isSourceLoaded) {
    sourcedataSubscription.unsubscribe();
    overrideOsMap(map);
  }
});

onMounted(() => {
  window.addEventListener('transitionend', resize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('transitionend', resize);
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

const mapLoaded = (map: maplibregl.Map) => {
  resize();
  addOsAttribution(map);
  addLayersToMap(map);

  applyWalks(map, walks, MapSourceLayer.LINES);
  applyWalks(map, selectedWalks.value, MapSourceLayer.SELECTED);
};

const zoomend = (map: maplibregl.Map): void => {
  zoom.value = map.getZoom();
};

const moveend = (map: maplibregl.Map): void => {
  center.value = map.getCenter();
};

const flyToSelection = () => {
  if (!selectedWalks.value.length) return;
  const walk = selectedWalks.value[0];

  const padding = 50;

  const coordinates = polyline.decode(walk.polyline).map<[number, number]>(([y, x]) => [x, y]);
  const bounds = coordinates.reduce(
    (acc, coord) => acc.extend(coord),
    new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
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

const hoveredMarker = new maplibregl.Marker(makeMarker());

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
.mapContainer {
  display: contents;

  :global(.maplibregl-map) {
    flex: 1;
    z-index: 0;

    :global(.maplibregl-canvas) {
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

:global(.maplibregl-ctrl-bottom-right) {
  margin-left: 100px;
}
</style>
