export interface Point {
    lat: number;
    long: number;
  }

export interface PointOnLine extends Point {
    bearing: number;
  }
