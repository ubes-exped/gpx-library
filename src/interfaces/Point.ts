export interface Point {
    lat: number;
    lng: number;
  }

export interface PointOnLine extends Point {
    bearing: number;
  }
