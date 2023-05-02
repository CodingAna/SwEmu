import { Point } from "./Geometry.js";
import { Utils } from "./Utils.js";
import { MyMath } from "./MyMath.js";

export class CustomDraw {
  constructor(canvas, context) {
    this._canvas = canvas;
    this._context = context;
  }

  setColor = (color) => {
    if (!Utils.startsWith(color, "#")) color = "#" + color;
    this._context.fillStyle = color;
    this._context.strokeStyle = color;
  }

  rect = (p1, p2, fill) => {
    if (!(p1 instanceof Point) || !(p2 instanceof Point)) return;
    if (fill === undefined) fill = true;

    this._context.beginPath();
    this._context.rect(p1.x, p1.y, p2.x-p1.x, p2.y-p1.y);
    if (fill) this._context.fill();
    else this._context.stroke();
  }

  roundedRect = (p1, p2, roundness, fill) => {
    if (!(p1 instanceof Point) || !(p2 instanceof Point)) return;
    if (roundness === undefined || roundness === null) roundness = 0.5;
    if (fill === undefined || fill === null) fill = true;

    let p3 = new Point(p2.x, p1.y);
    let p4 = new Point(p1.x, p2.y);

    let dy14 = p4.y - p1.y; // It must be guaranteed that p4.y >= p1.y
    let dx13 = p3.x - p1.x; // p3.x >= p1.x
    let r = (MyMath.min(dy14, dx13) / 2) * roundness;

    let pm1 = new Point(p1.x+r, p1.y+r);
    let pm2 = new Point(p2.x-r, p2.y-r);
    let pm3 = new Point(p3.x-r, p3.y+r);
    let pm4 = new Point(p4.x+r, p4.y-r);

    let pm1u = new Point(pm1.x, p1.y);;
    let pm1l = new Point(p1.x, pm1.y);

    let pm3u = new Point(pm3.x, p3.y);
    let pm3r = new Point(p3.x, pm3.y);

    let pm2d = new Point(pm2.x, p2.y);
    let pm2r = new Point(p2.x, pm2.y);

    let pm4d = new Point(pm4.x, p4.y);
    let pm4l = new Point(p4.x, pm4.y);

    // Top Left Arc
    // TODO: Only do loop if fill
    this.arc(pm1, r, fill, 1*Math.PI, 1.5*Math.PI);
    if (fill) {
      for (let i=0; i<r; i+=1/4) {
        let pm1ir = pm1u.interpolate(pm1, i/r);
        let pm1id = pm1l.interpolate(pm1, i/r);
        this.line(pm1ir, pm1id);
      }
    } else this.line(pm1u, pm3u);

    // Top Right Arc
    // TODO: Only do loop if fill
    this.arc(pm3, r, fill, 1.5*Math.PI, 2*Math.PI);
    if (fill) {
      for (let i=0; i<r; i+=1/4) {
        let pm3il = pm3u.interpolate(pm3, i/r);
        let pm3id = pm3r.interpolate(pm3, i/r);
        this.line(pm3il, pm3id);
      }
    } else this.line(pm3r, pm2r)

    // Bottom Right Arc
    // TODO: Only do loop if fill
    this.arc(pm2, r, fill, 0, 0.5*Math.PI);
    if (fill) {
      for (let i=0; i<r; i+=1/4) {
        let pm2il = pm2d.interpolate(pm2, i/r);
        let pm2iu = pm2r.interpolate(pm2, i/r);
        this.line(pm2il, pm2iu);
      }
    } else this.line(pm2d, pm4d);

    // Bottom Left Arc
    // TODO: Only do loop if fill
    this.arc(pm4, r, fill, 0.5*Math.PI, Math.PI);
    if (fill) {
      for (let i=0; i<r; i+=1/4) {
        let pm4ir = pm4d.interpolate(pm4, i/r);
        let pm4iu = pm4l.interpolate(pm4, i/r);
        this.line(pm4ir, pm4iu);
      }
    } else this.line(pm4l, pm1l);

    if (fill) {
      this.rect(pm1u, pm2d);
      this.rect(pm1l, pm2r);
    }
  }

  // TODO: triangle = (p1, p2, p3, ...) => {...}

  arc = (p, r, fill, start, around) => {
    if (!(p instanceof Point)) return;
    if (fill === undefined || fill === null) fill = true;
    if (start === undefined || start === null) start = 0;
    if (around === undefined || around === null) around = 2 * Math.PI;

    this._context.beginPath();
    this._context.arc(p.x, p.y, r, start, around);
    if (fill) this._context.fill();
    else this._context.stroke();
  }

  line = (p1, p2) => {
    if (!(p1 instanceof Point) || !(p2 instanceof Point)) return;

    this._context.beginPath();
    this._context.moveTo(p1.x, p1.y);
    this._context.lineTo(p2.x, p2.y);
    this._context.stroke();
  }

  text = (text, p, size, font, type, reposition) => {
    if (!(p instanceof Point)) return;
    if (size === undefined || size === null) size = 12;
    if (font === undefined || font === null) font = "sans-serif";
    if (type === undefined || type === null) type = "normal";
    if (reposition === undefined) reposition = false;
    // reposition === p treated as center position instead of left

    this._context.beginPath();
    this._context.font = type + " " + size + "pt " + font;
    this._context.fillText(text, reposition ? p.x - ((size / 1.8) * (text.length / 2)) : p.x, p.y);
  }
}
