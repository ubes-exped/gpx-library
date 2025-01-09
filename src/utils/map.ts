import { bounds as viewportBounds } from '@placemarkio/geo-viewport';
import { toGeoJSON } from '@mapbox/polyline';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import maplibregl from 'maplibre-gl';
import { nextTick, watch } from 'vue';
import type Walk from '@/interfaces/Walk';

export interface MapProperties {
  id: string;
}

export enum MapSourceLayer {
  LINES = 'lines',
  SELECTED = 'selected',
}

export enum MapLayer {
  LINES = 'lines',
  SELECTED = 'selected',
}

const fromZoom = (
  ...pairs: (readonly [zoom: number, value: number])[]
): maplibregl.ExpressionSpecification => [
  'interpolate',
  ['linear'],
  ['zoom'],
  ...pairs.flatMap(([zoomLevel, value]) => [zoomLevel, value]),
];

const makeGeoJsonData = (
  walks: readonly Walk[] = [],
): FeatureCollection<LineString, MapProperties> => ({
  type: 'FeatureCollection',
  features: walks
    .filter((walk) => walk.polyline)
    .map<Feature<LineString, MapProperties>>((walk) => ({
      type: 'Feature',
      properties: {
        id: walk.id,
      },
      geometry: toGeoJSON(walk.polyline),
    })),
});

const makeGeoJson = (walks: readonly Walk[] = []): maplibregl.GeoJSONSourceSpecification => ({
  type: 'geojson',
  data: makeGeoJsonData(walks),
});

interface LayerDef {
  source: MapSourceLayer;
  color: maplibregl.ExpressionSpecification | string;
  width: maplibregl.ExpressionSpecification | number;
  opacity: maplibregl.ExpressionSpecification | number;
}

const layers: Record<MapLayer, LayerDef> = {
  [MapLayer.LINES]: {
    source: MapSourceLayer.LINES,
    color: '#00F',
    opacity: fromZoom([5, 0.75], [10, 0.55]),
    width: fromZoom([5, 1], [17, 4], [22, 8]),
  },
  [MapLayer.SELECTED]: {
    source: MapSourceLayer.SELECTED,
    color: '#F00',
    opacity: 1,
    width: fromZoom([5, 4], [17, 8]),
  },
};

const buildLineLayer = (id: string, layer: LayerDef): maplibregl.LayerSpecification => ({
  id,
  type: 'line',
  source: layer.source,
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: {
    'line-color': layer.color,
    'line-width': layer.width,
  },
});

export const addLayersToMap = (map: maplibregl.Map) => {
  Object.values(MapSourceLayer).forEach(
    (id) => map.getSource(id) ?? map.addSource(id, makeGeoJson()),
  );

  Object.entries(layers).forEach(([id, layer]) => {
    if (map.getLayer(id)) map.removeLayer(id);
    map.addLayer(buildLineLayer(id, layer));
  });
};

export const applyWalks = (
  map: maplibregl.Map,
  next: readonly Walk[],
  sourceID: MapSourceLayer,
): void => {
  const source = map.getSource<maplibregl.GeoJSONSource>(sourceID);
  source?.setData(makeGeoJsonData(next));
};

const surround = (
  point: maplibregl.Point,
  offset: number,
): [maplibregl.PointLike, maplibregl.PointLike] => [
  [point.x - offset, point.y + offset],
  [point.x + offset, point.y - offset],
];

export type IdSelection = string | undefined;

interface UseMapSelectionConfig {
  getExternalSelection: () => IdSelection;
  flyToSelection: () => void;
  emitUpdate: (newSelection: IdSelection) => void;
}

interface UseMapSelection {
  click: (e: maplibregl.MapMouseEvent) => void;
}

export const useMapSelection = ({
  getExternalSelection,
  flyToSelection,
  emitUpdate,
}: UseMapSelectionConfig): UseMapSelection => {
  let localSelection: IdSelection;

  watch(getExternalSelection, () =>
    nextTick(() => {
      if (getExternalSelection() !== localSelection) {
        localSelection = getExternalSelection();
        flyToSelection();
      }
    }),
  );

  function select(id: IdSelection): void {
    localSelection = id;
    emitUpdate(localSelection);
  }

  const click = (e: maplibregl.MapMouseEvent): void => {
    const map = e.target;
    const originalEvent = e.originalEvent;
    // Ignore duplicate clicks
    if (originalEvent.detail > 1) return;

    for (let i = 0; i < 5; i += 1) {
      const neighbours = map.queryRenderedFeatures(surround(e.point, i), {
        layers: [MapSourceLayer.LINES, MapSourceLayer.SELECTED],
      });
      if (neighbours.length > 0) {
        select((neighbours[0].properties as MapProperties).id);
        return;
      }
    }
    select(undefined);
  };

  return { click };
};

export function greaterBounds(bounds: maplibregl.LngLatBoundsLike, map: maplibregl.Map) {
  const { center, zoom } = map.cameraForBounds(bounds) ?? {};
  if (!center || !zoom) {
    return bounds;
  }
  const dimensions: [number, number] = [
    Math.floor(map.getCanvas().offsetWidth),
    Math.floor(map.getCanvas().offsetHeight),
  ];
  // Mapbox vector tiles are 512x512, as opposed to the library's assumed default of 256x256, hence the final `512` argument
  return viewportBounds(maplibregl.LngLat.convert(center).toArray(), zoom, dimensions, 512);
}
