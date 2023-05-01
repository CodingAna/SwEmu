import { MyMath } from "./MyMath.js";

export class Point {
  constructor(x, y) {
    if (x === undefined || isNaN(x)) x = 0;
    if (y === undefined || isNaN(y)) y = 0;
    this.x = x;
    this.y = y;

    // TODO: This doesn't really work, fix!
    if (x instanceof Point && y === undefined) {
      this.x = x.x;
      this.y = x.y;
    }
  }

  interpolate = (point, t) => {
    if (!(point instanceof Point)) return;
    let dx = point.x - this.x;
    let dy = point.y - this.y;
    return new Point(dx*t, dy*t).add(this);
  }

  add = (point) => {
    if (!(point instanceof Point)) return;
    this.x += point.x;
    this.y += point.y;
    return this;
  }

  add_NW = (point) => {
    if (!(point instanceof Point)) return;
    return new Point(this.x + point.x, this.y + point.y);
  }

  multiply = (a) => {
    this.x *= a;
    this.y *= a;

    return this;
  }

  multiply_NW = (a) => {
    return new Point(this.x * a, this.y * a);
  }
}

export class Line {
  constructor(p1, p2) {
    if (!(p1 instanceof Point) || !(p2 instanceof Point))return;
    this.p1 = p1;
    this.p2 = p2;
  }

  vector = () => {
    return new Vector2D(this.p1.x-this.p2.x, this.p1.y-this.p2.y);
  }
}

export class Vector2D {
  constructor(x, y) {
    if (x === undefined) x = 0;
    if (y === undefined) y = 0;
    this.x = x;
    this.y = y;

    if (x instanceof Point && y instanceof Point) {
      this.x = x.x - y.x;
      this.y = x.y - y.y;
    }
  }

  length = () => {
    return Math.sqrt(MyMath.exp(this.x, 2) + MyMath.exp(this.y, 2))
  }

  normalize = () => {
    let len = this.length();
    this.x /= len;
    this.y /= len;

    return this;
  }

  multiply = (a) => {
    this.x *= a;
    this.y *= a;

    return this;
  }

  multiply_NW = (a) => {
    return new Vector2D(this.x * a, this.y * a);
  }

  point = () => {
    return new Point(this.x, this.y);
  }
}
