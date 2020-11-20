export interface RawWalk {
  description?: string;
  name?: string;
  author?: string;
  tags?: string[];
  filename: string;

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
  readonly description?: string;

  readonly name?: string;

  readonly filename: string;

  readonly author?: string;

  readonly tags?: string[];

  readonly heights: number[];

  readonly length: number;

  readonly polyline: string;

  readonly index: number;

  private static counter = 0;

  constructor(walk: RawWalk) {
    this.description = walk.description;
    this.name = walk.name;
    this.filename = walk.filename;
    this.author = walk.author;
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
}
