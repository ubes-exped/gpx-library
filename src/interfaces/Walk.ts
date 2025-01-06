import polyline from "@mapbox/polyline";
import turfBearing from "@turf/bearing";
import turfDestination from "@turf/destination";
import turfDistance from "@turf/distance";
import { PointOnLine } from "./Point";

export interface RawWalk {
  id: string;
  filename: string;
  name?: string;
  description?: string;
  author?: string;
  tags?: string[];

  ele: string;
  ascent: number;
  length: number;
  polyline: string;
}

export default class Walk {
  readonly id: string;

  readonly filename: string;

  readonly name?: string;

  readonly description?: string;

  readonly author?: string;

  readonly tags?: string[];

  readonly heights: string;

  /** The length of the route in metres */
  readonly length: number;

  readonly ascent: number;

  readonly polyline: string;

  /** Needed because Mapbox can only deal with numeric IDs */
  readonly index: number;

  private static counter = 0;

  constructor(walk: RawWalk) {
    this.id = walk.id;
    this.filename = walk.filename;
    this.name = walk.name;
    this.description = walk.description;
    this.author = walk.author;
    this.tags = walk.tags;
    this.heights = walk.ele;
    this.ascent = walk.ascent;
    this.length = walk.length;
    this.polyline = walk.polyline;

    Walk.counter += 1;
    this.index = Walk.counter;
  }

  /** Distance of the walk in kilometres */
  get distance(): number {
    return this.length / 1000;
  }

  #elevationGraph?: {lineString: string, width: number, height: number};

  get elevationGraph() {
    this.#elevationGraph ??= this.makeElevationGraph();
    return this.#elevationGraph;
  }

  private makeElevationGraph() {
    const width = 500;
    let height = 100;

    // distance, height in metres. They are served from the server in hundreds of kilometres
    // for efficiency (so resolution is exactly 1m).
    const points = polyline.decode(this.heights).map((point) => point.map((c) => c * 1e5));

    const { min: minElevation, max: maxElevation } = points.reduce(
      ({ min, max }, [, elevation]) => ({
        min: Math.min(min, elevation), max: Math.max(max, elevation),
      }),
      { min: +Infinity, max: -Infinity },
    );
    const elevationRange = maxElevation - minElevation;

    // Ensure the graph never exaggerates too much
    const maxExaggeration = 20;
    if (height / width > maxExaggeration * (elevationRange / this.length)) {
      height = maxExaggeration * (elevationRange / this.length) * width;
    }

    const yValue = (elevation: number) => ((maxElevation - elevation) / elevationRange) * height;
    const scale = width / this.length;
    const pathString = points
      .map(([distance, elevation]) => [distance * scale, yValue(elevation)].join(" "))
      .join("L");

    return { width, height, lineString: `M${pathString}` };
  }

  /**
   * Get the position and direction at a certain proportion of the way through the route
   *
   * @param {number} proportion a number between 0 and 1, where 0 is the start and 1 is the end
   * @memberof Walk
   */
  getOffset(proportion: number): PointOnLine {
    const distanceAlong = proportion * this.distance;
    // Prev and Next are [lat, lng] pairs, but turf accepts [long, lat].
    const line = polyline.decode(this.polyline).map(([lat, lng]) => [lng, lat]);

    let travelled = 0;
    for (let i = 0; ; i += 1) {
      if (travelled >= distanceAlong || i + 1 >= line.length) {
        const overshot = travelled - distanceAlong;

        const bearing = i === 0
          ? turfBearing(line[0], line[1])
          : turfBearing(line[i - 1], line[i]);
        const [lng, lat] = overshot > 0
          ? turfDestination(line[i], -overshot, bearing).geometry?.coordinates ?? line[i]
          : line[i];
        return { lat, lng, bearing };
      }
      travelled += turfDistance(line[i], line[i + 1]);
    }
  }
}
