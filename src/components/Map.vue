<template>
  <div
    ref="container"
    class="map-container"
  >
    <div
      v-if="isFirstMap"
      id="map"
      ref="mapElem"
    />
  </div>
</template>
<script lang="ts">
import {
  Component,
  Vue,
  PropSync,
  Watch,
  Ref,
  Emit,
  Prop,
} from "vue-property-decorator";

import GeoJSON from "geojson";
import * as mapboxgl from "mapbox-gl";
import polyline from "@mapbox/polyline";
import Walk, { PointOnLine } from "@/interfaces/Walk";
import "mapbox-gl/dist/mapbox-gl.css";

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
  ...pairs.flatMap(([zoomLevel, value]) => [zoomLevel, value]),
];

const makeGeoJsonData = (walks: Walk[] = []): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: walks
    .filter((walk) => walk.polyline)
    .map((walk) => ({
      type: "Feature",
      id: walk.index,
      properties: null,
      geometry: polyline.toGeoJSON(walk.polyline),
    })),
});

const makeGeoJson = (): mapboxgl.GeoJSONSourceRaw => ({
  type: "geojson",
  data: makeGeoJsonData(),
});

const sources = ["lines", "selected"];

const layers = {
  lines: {
    source: "lines",
    color: "#00F",
    opacity: fromZoom([5, 0.75], [10, 0.55]),
    width: fromZoom([5, 1], [17, 4], [22, 8]),
  },
  selected: {
    source: "selected",
    color: "#F00",
    opacity: 1,
    width: fromZoom([5, 4], [17, 8]),
  },
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
    "line-width": layer.width,
  },
});

const makeMarker = () => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<svg class="arrow" viewBox="0 0 500 800">
    <polygon points="100,400 200,400 250,300 300,400 400,400 250,100" class="triangle" />
  </svg>`;
  return wrapper;
};

@Component
export default class Map extends Vue {
  isFirstMap: boolean = !window.cachedMapComponent;

  @Prop({ default: null }) hoveredPoint!: PointOnLine | null;

  hoveredMarker = new mapboxgl.Marker(makeMarker());

  @PropSync("center", { required: true }) modelCenter!: mapboxgl.LngLatLike;

  @PropSync("zoom", { default: 0 }) modelZoom!: number;

  @Prop({ default: null })
  selected!: Walk | null;

  @Prop({ default: () => [] }) walks!: Walk[];

  @Ref() container!: HTMLDivElement;

  @Ref() mapElem!: HTMLDivElement;

  localSelected: number | null = this.selected?.index ?? null;

  token =
    "pk.eyJ1IjoiY2hhcmRpbmciLCJhIjoiY2tocjJpcW5wMGYyOTJydDBicTZvam8xcCJ9.ZJfnHJE_5dJNCsEsQCrwJw";

  mapStyle = "mapbox://styles/charding/ckhr4mjb11o5n19ke1n26cv1c";

  map?: mapboxgl.Map = undefined;

  @Watch("mapStyle") onMapStyle(style: string) {
    this.map?.setStyle(style);
  }

  mapLoaded(map: mapboxgl.Map) {
    map.resize();

    sources.forEach((id) => map.addSource(id, makeGeoJson()));

    Object.entries(layers).forEach(([id, layer]) => map.addLayer(buildLineLayer(id, layer)));

    this.applyProps();
  }

  @Watch("hoveredPoint", { immediate: true })
  onHoveredPoint(point: PointOnLine | null) {
    if (!point) {
      this.hoveredMarker.remove();
    } else {
      this.hoveredMarker.setLngLat([point.long, point.lat]);
      const arrow = this.hoveredMarker
        .getElement()
        .querySelector(".arrow") as HTMLElement;
      arrow.style.transform = `rotate(${point.bearing}deg)`;
      if (this.map) this.hoveredMarker.addTo(this.map);
    }
  }

  click(map: mapboxgl.Map, e: mapboxgl.MapMouseEvent) {
    const surround = (
      point: mapboxgl.Point,
      offset: number,
    ): [mapboxgl.PointLike, mapboxgl.PointLike] => [
      [point.x - offset, point.y + offset],
      [point.x + offset, point.y - offset],
    ];
    for (let i = 0; i < 5; i += 1) {
      const neighbours = map.queryRenderedFeatures(surround(e.point, i), {
        layers: ["lines"],
      });
      if (neighbours.length > 0) {
        this.selectIndex(neighbours[neighbours.length - 1].id as number);
        return;
      }
    }
    this.select(null);
  }

  selectIndex(walkIndex: number) {
    this.select(this.walks.find((walk) => walk.index === walkIndex) ?? null);
  }

  select(walk: Walk | null) {
    if (this.localSelected === (walk?.index ?? null)) return;

    this.localSelected = walk?.index ?? null;

    if (walk) this.$router.replace({ name: "Walk", params: { id: walk.id } });
    else this.$router.replace({ name: "MaybeFilter" });
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

  @Watch("walks") onWalks() {
    this.applyWalks(this.walks, "lines");
  }

  @Watch("selected") onSelected() {
    this.applyWalks(this.selected !== null ? [this.selected] : [], "selected");

    this.$nextTick(() => {
      if (this.selected?.index ?? this.localSelected !== null) {
        this.localSelected = this.selected?.index ?? null;
        this.flyTo(this.selected);
      }
    });
  }

  applyProps() {
    this.onWalks();
    this.onSelected();
  }

  flyTo(walk: Walk | null) {
    if (!walk) return;

    const padding = 50;

    const { map } = this;

    if (!map) return;
    const coordinates = polyline
      .decode(walk.polyline)
      .map<[number, number]>(([y, x]) => [x, y]);
    const bounds = coordinates.reduce(
      (acc, coord) => acc.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
    );
    map.fitBounds(bounds, { padding, maxZoom: 20 });
  }

  resizeListener?: () => void;

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
        zoom: this.modelZoom,
      });
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.addControl(new mapboxgl.ScaleControl(), "bottom-left");
    }
    this.map = map;

    // Always delegate to the correct instance
    window.cachedMapComponent = this;
    this.map.on("zoomend", () => window.cachedMapComponent?.zoomend(map));
    this.map.on("moveend", () => window.cachedMapComponent?.moveend(map));
    this.map.on("click", (ev) => window.cachedMapComponent?.click(map, ev));
    this.map.on("load", () => window.cachedMapComponent?.mapLoaded(map));

    // Apply provided props
    this.applyProps();

    // Add event listener for checking the map is the right size
    this.resizeListener = () => this.map?.resize();
    document.body.addEventListener("transitionend", this.resizeListener);
  }

  beforeDestroy() {
    if (this.resizeListener) {
      window.removeEventListener("hashchange", this.resizeListener);
    }
  }
}
</script>

<style>
.map-container {
  display: contents;
}
#map {
  flex: 1;
  z-index: 0;
}

.mapboxgl-canvas {
  cursor: pointer;
}

#map .arrow {
  width: 3em;
}
#map .triangle {
  fill: #f00;
  stroke: white;
  stroke-width: 20;
}
</style>
