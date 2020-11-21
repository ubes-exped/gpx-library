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

export default class Walk {
  readonly id: string;

  readonly filename: string;

  readonly name?: string;

  readonly description?: string;

  readonly author?: string;

  readonly tags?: string[];

  readonly heights: number[];

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
}
