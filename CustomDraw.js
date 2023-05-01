import { Point } from "./Geometry.js";
import { Utils } from "./Utils.js";

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

  arc = (p, r, fill) => {
    if (!(p instanceof Point)) return;
    if (fill === undefined) fill = true;

    this._context.beginPath();
    this._context.arc(p.x, p.y, r, 0, Math.PI * 2);
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
