import { computed, ref, watch } from 'vue';

export enum MapStyle {
  OS_MAP = 'OS_MAP',
  MAPBOX = 'MAPBOX',
}

const localStorageMapStyleKey = 'gpx-library-map-style';
const mapStyles = [MapStyle.OS_MAP, MapStyle.MAPBOX];

const cachedMapStyleIndex = mapStyles.indexOf(
  localStorage.getItem(localStorageMapStyleKey) as MapStyle,
);

export function updateMapStyleCache(style: MapStyle) {
  localStorage.setItem(localStorageMapStyleKey, style);
}

export function useMapStyle() {
  const mapStyleIndex = ref(cachedMapStyleIndex > -1 ? cachedMapStyleIndex : 0);

  const mapStyle = computed(() => mapStyles[mapStyleIndex.value]);

  const nextMapStyle = () => {
    mapStyleIndex.value = (mapStyleIndex.value + 1) % mapStyles.length;
  };

  watch(mapStyle, (mapStyle) => {
    localStorage.setItem(localStorageMapStyleKey, mapStyle);
  });

  return { mapStyle, nextMapStyle };
}
