import { MyMath } from "../MyMath.js";
import { NetworkConnection } from "../OS.js";
import { Utils } from "../Utils.js";
import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class PongMP {
  static get NAME() {return "PongMP";}

  constructor(swemu) {
    this._swemu = swemu;
  }

  dpad_up = () => {
  }

  dpad_down = () => {
  }

  buttons_a = () => {
  }

  buttons_b = () => {
    if (this._started) this.init(this._user);
    else this.terminate();
  }

  buttons_y = () => {
  }

  buttons_x = () => {
  }

  buttons_pause = () => {
  }

  init = (user) => {
    this._terminated = false;
    this._paused = false;
    this._started = false;
    this._user = user;

    return this;
  }

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
    if (this._terminated) return;
    if (this._paused) return;
  }
}
