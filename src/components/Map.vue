<template>
  <div ref="container" class="map-container">
    <div v-if="isFirstMap" id="map" ref="mapElem" />
  </div>
</template>
<script lang="ts">
import {
  Component,
  Vue,
  PropSync,
  Watch,
  Ref,
  Emit
} from "vue-property-decorator";

import GeoJSON from "geojson";
import * as mapboxgl from "mapbox-gl";
import polyline from "@mapbox/polyline";
import Walk from "@/interfaces/Walk";

declare global {
  interface Window {
    // eslint-disable-next-line no-use-before-define
    cachedMapComponent?: Map;
  }
}

const fromZoom = (...pairs: [number, number][]): mapboxgl.Expression => [
  "interpolate",
  ["linear"],
  ["zoom"],
  ...pairs.flatMap(([zoomLevel, value]) => [zoomLevel, value])
];

const makeGeoJsonData = (walks: Walk[] = []): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: walks
    .filter(walk => walk.polyline)
    .map(walk => ({
      type: "Feature",
      id: walk.index,
      properties: null,
      geometry: polyline.toGeoJSON(walk.polyline)
    }))
});

const makeGeoJson = (): mapboxgl.GeoJSONSourceRaw => ({
  type: "geojson",
  data: makeGeoJsonData()
});

const sources = ["lines", "selected"];

const layers = {
  lines: {
    source: "lines",
    color: "#00F",
    opacity: fromZoom([5, 0.75], [10, 0.35]),
    width: fromZoom([5, 1], [17, 4], [22, 8])
  },
  selected: {
    source: "selected",
    color: "#0F0",
    opacity: 1,
    width: fromZoom([5, 4], [17, 8])
  }
};

type LayerDef = typeof layers[keyof typeof layers];

const buildLineLayer = (id: string, layer: LayerDef): mapboxgl.Layer => ({
  id,
  type: "line",
  source: layer.source,
  layout: { "line-join": "round", "line-cap": "round" },
  paint: {
    "line-color": layer.color,
    "line-opacity": layer.opacity,
    "line-width": layer.width
  }
});

@Component({
  head: {
    link: [
      {
        href: "https://api.mapbox.com/mapbox-gl-js/v1.11.0/mapbox-gl.css",
        rel: "stylesheet"
      }
    ]
  }
})
export default class Map extends Vue {
  isFirstMap: boolean = !window.cachedMapComponent;

  @PropSync("center", { required: true }) modelCenter!: mapboxgl.LngLatLike;

  @PropSync("zoom", { default: 0 }) modelZoom!: number;

  @PropSync("selected", { default: () => null })
  modelSelected!: number | null;

  @PropSync("improvedHillshade", { default: true })
  modelImprovedHillshade!: boolean;

  @PropSync("walks", { default: () => [] }) modelWalks!: Walk[];

  @Ref() container!: HTMLDivElement;

  @Ref() mapElem!: HTMLDivElement;

  localSelected: number | null = this.modelSelected;

  get selectedWalk() {
    return (
      this.modelWalks.find(walk => this.modelSelected === walk.index) ?? null
    );
  }

  token =
    "pk.eyJ1IjoiY2hhcmRpbmciLCJhIjoiY2tiYWp0cndkMDc0ZjJybXhlcHdoM2Z3biJ9.XUwOLV17ZBXE8dhp198dqg";

  mapStyle = "mapbox://styles/charding/ckbfof39h4b2t1ildduhwlm15";

  map?: mapboxgl.Map = undefined;

  @Watch("mapStyle") onMapStyle(style: string) {
    this.map?.setStyle(style);
  }

  @Watch("modelImprovedHillshade") onImprovedHillshade(
    improvedHillshade: boolean
  ) {
    this.map?.setLayoutProperty(
      "improved-hillshading",
      "visibility",
      improvedHillshade ? "visible" : "none"
    );
    this.map?.setLayoutProperty(
      "hillshade-greys",
      "visibility",
      !improvedHillshade ? "visible" : "none"
    );
  }

  mapLoaded(map: mapboxgl.Map) {
    map.resize();

    sources.forEach(id => map.addSource(id, makeGeoJson()));

    Object.entries(layers).forEach(([id, layer]) =>
      map.addLayer(buildLineLayer(id, layer))
    );

    this.onImprovedHillshade(this.modelImprovedHillshade);

    this.applyProps();
  }

  click(map: mapboxgl.Map, e: mapboxgl.MapMouseEvent) {
    const surround = (
      point: mapboxgl.Point,
      offset: number
    ): [mapboxgl.PointLike, mapboxgl.PointLike] => [
      [point.x - offset, point.y + offset],
      [point.x + offset, point.y - offset]
    ];
    for (let i = 0; i < 5; i += 1) {
      const neighbours = map.queryRenderedFeatures(surround(e.point, i), {
        layers: ["lines"]
      });
      if (neighbours.length > 0) {
        this.select(neighbours[neighbours.length - 1].id as number);
        return;
      }
    }
    this.select(null);
  }

  // eslint-disable-next-line class-methods-use-this
  select(id: number | null) {
    this.localSelected = id;
    this.modelSelected = id;
  }

  zoomend(map: mapboxgl.Map) {
    this.modelZoom = map.getZoom();
  }

  @Emit("update:center")
  moveend(map: mapboxgl.Map) {
    return map.getCenter();
  }

  applyWalks(next: Walk[], sourceID: string) {
    const source = this.map?.getSource(sourceID);
    (source as mapboxgl.GeoJSONSource)?.setData(makeGeoJsonData(next));
  }

  @Watch("modelWalks") onWalks() {
    this.applyWalks(this.modelWalks, "lines");
  }

  @Watch("selected") onSelected() {
    this.$nextTick(() => {
      if (this.modelSelected !== this.localSelected) {
        this.localSelected = this.modelSelected;
        this.flyTo(this.selectedWalk);
      }
    });
  }

  @Watch("selectedWalk") onSelectedWalk() {
    this.applyWalks(
      this.selectedWalk !== null ? [this.selectedWalk] : [],
      "selected"
    );
  }

  applyProps() {
    this.onWalks();
  }

  zoomToSelected() {
    this.flyTo(this.selectedWalk, true);
  }

  flyTo(walk: Walk | null, zoom = false) {
    if (!walk) return;

    const padding = 20;

    const { map } = this;

    if (!map) return;
    const coordinates = polyline
      .decode(walk.polyline)
      .map<[number, number]>(([y, x]) => [x, y]);
    const bounds = coordinates.reduce(
      (acc, coord) => acc.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    );
    const { width, height } = map.getCanvas().getBoundingClientRect();
    const screenNorthEast = map.unproject([width - padding, padding]);
    const screenSouthWest = map.unproject([padding, height - padding]);
    const screenBounds = new mapboxgl.LngLatBounds(
      screenSouthWest,
      screenNorthEast
    );
    if (
      zoom ||
      !screenBounds.contains(bounds.getSouthWest()) ||
      !screenBounds.contains(bounds.getNorthEast())
    ) {
      const maxZoom = zoom ? 30 : map.getZoom();
      map.fitBounds(bounds, {
        padding,
        linear: true,
        maxZoom
      });
    }
  }

  mounted() {
    let map: mapboxgl.Map;
    const cachedMap = window.cachedMapComponent?.map;
    if (cachedMap) {
      this.container.appendChild(cachedMap.getContainer());
      map = cachedMap;
    } else {
      map = new mapboxgl.Map({
        accessToken: this.token,
        container: this.mapElem,
        style: this.mapStyle,
        center: this.modelCenter,
        zoom: this.modelZoom
      });
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.addControl(new mapboxgl.ScaleControl(), "bottom-left");
    }
    this.map = map;

    // Always delegate to the correct instance
    window.cachedMapComponent = this;
    this.map.on("zoomend", () => window.cachedMapComponent?.zoomend(map));
    this.map.on("moveend", () => window.cachedMapComponent?.moveend(map));
    this.map.on("click", ev => window.cachedMapComponent?.click(map, ev));
    this.map.on("load", () => window.cachedMapComponent?.mapLoaded(map));

    // Apply provided props
    this.applyProps();
  }
}
</script>

<style>
.map-container {
  display: contents;
}
#map {
  flex: 1;
}

.mapboxgl-canvas {
  cursor: pointer;
}
</style>