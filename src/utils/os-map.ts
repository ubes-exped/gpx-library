import type { GeoJSON } from 'geojson';
import type * as mapboxgl from 'mapbox-gl';

export const osKey = 'q6ygAjaocSqBV553jubhAFqd9o4yiczG';

export const ukBounds: mapboxgl.LngLatBoundsLike = [
  [-10.76418, 49.528423],
  [1.9134116, 61.331151],
];

// Hide all land to the south of the UK
const southCover: GeoJSON = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    // These coordinates outline Maine.
    coordinates: [
      [
        [-11, 49],
        [-7, 49],
        [1, 50.7],
        [7, 56],
        [7, 0],
        [-11, 0],
        [-11, 49],
      ],
    ],
  },
};

function removeBackground(map: mapboxgl.Map) {
  const backLayerId = map.getStyle()?.layers[0].id;
  if (backLayerId && map.getLayer(backLayerId)?.type === 'background') {
    map.removeLayer(backLayerId);
  }
}

export function addOsAttribution(map: mapboxgl.Map) {
  const esri = map.getSource('esri');
  if (esri) {
    esri.attribution = `Contains OS data © Crown copyright and database rights ${new Date().getFullYear().toFixed(0)}`;
  }
}

export function overrideOsMap(map: mapboxgl.Map) {
  const backgroundLayerName = 'Background';
  const backgroundColor = map.getPaintProperty(backgroundLayerName, 'fill-color') as
    | string
    | undefined;
  if (backgroundColor) {
    map.getContainer().style.backgroundColor = backgroundColor;

    const coverLayerId = 'south-cover';

    if (!map.getSource(coverLayerId)) {
      map.addSource(coverLayerId, {
        type: 'geojson',
        data: southCover,
      });
    }

    if (!map.getLayer(coverLayerId)) {
      map.addLayer(
        {
          id: coverLayerId,
          type: 'fill',
          source: coverLayerId,
          layout: {},
          paint: { 'fill-color': backgroundColor },
        },
        'OS/GB_land/1',
      );
    }
  }

  removeBackground(map);
}
