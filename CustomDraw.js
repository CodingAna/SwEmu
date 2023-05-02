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
    let r = (dy14 / 2) * roundness;

    let pm1 = new Point(p1.x+r, p1.y+r);
    let pm2 = new Point(p2.x-r, p2.y-r);
    let pm3 = new Point(p3.x-r, p3.y+r);
    let pm4 = new Point(p4.x+r, p4.y-r);

    this._context.beginPath();
    this._context.arc(pm1.x, pm1.y, r, Math.PI, Math.PI * 2);
    this._context.arc(pm2.x, pm2.y, r, 0, Math.PI);
    this._context.arc(pm3.x, pm3.y, r, Math.PI, Math.PI * 2);
    this._context.arc(pm4.x, pm4.y, r, 0, Math.PI);

    if (fill) this._context.fill();
    else this._context.stroke();

    this.rect(new Point(pm1.x, p1.y), new Point(pm2.x, p2.y));
    this.rect(new Point(p1.x, pm1.y), new Point(p2.x, pm2.y));
  }

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
