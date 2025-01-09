import type { GeoJSON } from 'geojson';

export const ukBounds: maplibregl.LngLatBoundsLike = [
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

function removeBackground(map: maplibregl.Map) {
  const backLayerId = map.getLayersOrder()[0];
  if (map.getLayer(backLayerId)?.type === 'background') {
    map.removeLayer(backLayerId);
  }
}

export function overrideOsMap(map: maplibregl.Map) {
  const backgroundLayerName = 'Background';
  const backgroundLayer = map.getLayer(backgroundLayerName);
  const backgroundColor = backgroundLayer?.getPaintProperty('fill-color') as string | undefined;
  if (backgroundColor) {
    map.getContainer().style.backgroundColor = backgroundColor;

    const coverLayerId = 'south-cover';

    if (!map.getSource(coverLayerId)) {
      map.addSource('south-cover', {
        type: 'geojson',
        data: southCover,
      });
    }

    if (!map.getLayer(coverLayerId)) {
      map.addLayer(
        {
          id: 'south-cover',
          type: 'fill',
          source: 'south-cover',
          layout: {},
          paint: { 'fill-color': backgroundColor },
        },
        'OS/GB_land/1',
      );
    }
  }

  removeBackground(map);
}
