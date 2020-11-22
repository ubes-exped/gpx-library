import polyline from "@mapbox/polyline";
import turfBearing from "@turf/bearing";
import turfDestination from "@turf/destination";
import turfDistance from "@turf/distance";

import { routesFile } from "@/config";

export interface RawWalk {
  id: string;
  filename: string;
  name?: string;
  description?: string;
  author?: string;
  tags?: string[];

  heights: number[];
  length: number;
  polyline: string;
}

function getAscent(heights: number[]): number {
  return heights.reduce(
    ({ prev, ascent }, next) => ({ prev: next, ascent: ascent + Math.max(0, next - prev) }),
    { prev: +Infinity, ascent: 0 },
  ).ascent;
}

export interface PointOnLine {
  lat: number;
  long: number;
  bearing: number;
}

export default class Walk {
  readonly id: string;

  readonly filename: string;

  readonly name?: string;

  readonly description?: string;

  readonly author?: string;

  readonly tags?: string[];

  readonly heights: number[];

  /** The length of the route in metres */
  readonly length: number;

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
    this.heights = walk.heights;
    this.length = walk.length;
    this.polyline = walk.polyline;

    Walk.counter += 1;
    this.index = Walk.counter;
  }

  /** Distance of the walk in kilometres */
  get distance(): number {
    return this.length / 1000;
  }

  #ascent?: number;

  /** Total ascent of the walk in metres. This is calculated once. */
  get ascent(): number {
    this.#ascent ??= getAscent(this.heights);
    return this.#ascent;
  }

  get href(): string {
    return new URL(`/${this.filename}`, routesFile).href;
  }

  get elevationGraph() {
    const width = 500;
    let height = 100;
    const step = width / (this.heights.length - 1);
    const { min: minElevation, max: maxElevation } = this.heights.reduce(({ min, max }, next) => ({
      min: Math.min(min, next), max: Math.max(max, next),
    }), { min: +Infinity, max: -Infinity });
    const elevationRange = maxElevation - minElevation;

    // Ensure the graph never exaggerates too much
    const maxExaggeration = 20;
    if (height / width > maxExaggeration * (elevationRange / this.length)) {
      height = maxExaggeration * (elevationRange / this.length) * width;
    }

    const yValue = (elevation: number) => ((maxElevation - elevation) / elevationRange) * height;
    const points = this.heights
      .map((elevation, index) => [index * step, yValue(elevation)].join(" "))
      .join("L");

    return `
      <svg viewBox="0 -2 ${width} ${height + 4}" xmlns="http://www.w3.org/2000/svg">
        <path d="M${points}"
          stroke="var(--color)"
          stroke-width="4"
          stroke-linecap="square"
          stroke-linejoin="round"
          fill="transparent" />
      </svg>`;
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
        const [long, lat] = overshot > 0
          ? turfDestination(line[i], -overshot, bearing).geometry?.coordinates ?? line[i]
          : line[i];
        return { lat, long, bearing };
      }
      travelled += turfDistance(line[i], line[i + 1]);
    }
  }
}
