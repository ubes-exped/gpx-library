export interface WalkSegment {
  heights: number[];
  length: number;
  polyline: string;
}

export interface RawWalk {
  description?: string;
  name?: string;
  filename: string;
  segments: WalkSegment[];
}

export default class Walk {
  readonly description?: string;

  readonly name?: string;

  readonly filename: string;

  readonly segments: WalkSegment[];

  constructor(walk: RawWalk) {
    this.description = walk.description;
    this.name = walk.name;
    this.filename = walk.filename;
    this.segments = walk.segments;
  }

  #distance?:number;

  get distance(): number {
    this.#distance ??= this.segments.reduce((acc, segment) => acc + segment.length, 0);
    return this.#distance;
  }
}
