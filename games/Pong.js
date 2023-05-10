import { MyMath } from "../MyMath.js";
import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class Pong {
  static get NAME() {return "Pong";}

  constructor(swemu) {
    this._swemu = swemu;
  }

  buttons_a = () => {
  }

  buttons_b = () => {
    if (this._player.started) this.init(this._user);
    else this.terminate();
  }

  buttons_pause = () => {
  }

  _updateBall = (draw, gamepads, render, ux, uy) => {
    if (ux === undefined || ux === null) ux = true;
    if (uy === undefined || uy === null) uy = true;

    // this._ball.point.add(this._ball.move.multiply_NW(render.deltaTime * 100 * this._ball.speed));
    let mm = this._ball.move.multiply_NW(render.deltaTime * 100 * this._ball.speed);
    if (ux) this._ball.point.x += mm.x;
    if (uy) this._ball.point.y += mm.y;

    let sl = this._player.score.left;
    let yl = this._player.y.left;
    let sr = this._player.score.right;
    let yr = this._player.y.right;
    if (this._ball.point.x + this._ball.radius >= this._swemu.screen.width) {
      sr++;
      this.init();
    } else if (this._ball.point.x - this._ball.radius <= 0) {
      sl++;
      this.init();
    }
    this._player.score.left = sl;
    this._player.score.right = sr;
    this._player.y.left = yl;
    this._player.y.right = yr;
  }

  _renderBall = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    draw.dynamic.arc(this._ball.point, 6);
  }

  _updatePlayers = (draw, gamepads, render) => {
    this._player.y.left += gamepads.output.axes[1] * render.deltaTime * 100 * this._player.speed;
    if (this._player.y.left < 0) this._player.y.left = 0;
    else if (this._player.y.left > this._swemu.screen.height - this._player.model.y) this._player.y.left = this._swemu.screen.height - this._player.model.y;

    // One Controller: output[0].axes[3] OR Two Controller: output[1].axes[1]
    let cdata = this._controller_mode === 0 ? gamepads.output.axes[3] : gamepads.output[1].axes[1]
    this._player.y.right += cdata * render.deltaTime * 100 * this._player.speed;
    if (this._player.y.right < 0) this._player.y.right = 0;
    else if (this._player.y.right > this._swemu.screen.height - this._player.model.y) this._player.y.right = this._swemu.screen.height - this._player.model.y;
  }

  _renderPlayers = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");

    let leftPlayer = new Point(this._player.xOffset, this._player.y.left);
    draw.dynamic.rect(leftPlayer, this._player.model.add_NW(leftPlayer));

    let rightPlayer = new Point(this._swemu.screen.width - (this._player.xOffset + this._player.model.x), this._player.y.right);
    draw.dynamic.rect(rightPlayer, this._player.model.add_NW(rightPlayer));
  }

  _renderScore = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    let mid = new Point(this._swemu.screen.width / 2, 10);
    let sl = ""+this._player.score.left;
    let sr = ""+this._player.score.right;
    draw.dynamic.text(sl, new Point(sl.length * 14, 14).add(mid), 14);
    draw.dynamic.text(sr, new Point(-14, 14).add(mid), 14);
  }

  _checkHitbox = (draw, gamepads, render) => {
    // Check bottom / top
    if (this._ball.point.y - this._ball.radius <= 0) {
      this._ball.move.y *= -1;
      this._updateBall(draw, gamepads, render, false, true);
    } else if (this._ball.point.y + this._ball.radius >= this._swemu.screen.height) {
      this._ball.move.y *= -1;
      this._updateBall(draw, gamepads, render, false, true);
    }

    // Check right player
    if (this._ball.point.x + this._ball.radius >= this._swemu.screen.width - this._player.xOffset - this._player.model.x && this._ball.point.x - this._ball.radius <= this._swemu.screen.width - this._player.xOffset) {
      if (this._ball.point.y + this._ball.radius >= this._player.y.right && this._ball.point.y - this._ball.radius <= this._player.y.right + this._player.model.y) {
        this._ball.point.x = this._swemu.screen.width - this._player.xOffset - this._player.model.x;
        this._ball.move.x *= -1;
        this._ball.move.y += gamepads.output.axes[3] * 0.5;
        //this._ball.move.y *= 1 + gamepads.output.axes[3];
        this._updateBall(draw, gamepads, render, true, false);
      }
    }

    // Check left player
    if (this._ball.point.x - this._ball.radius <= this._player.xOffset + this._player.model.x && this._ball.point.x + this._ball.radius >= this._player.xOffset) {
      if (this._ball.point.y + this._ball.radius >= this._player.y.left && this._ball.point.y - this._ball.radius <= this._player.y.left + this._player.model.y) {
        this._ball.point.x = this._player.xOffset + this._player.model.x;
        this._ball.move.x *= -1;
        this._ball.move.y += gamepads.output.axes[1] * 0.5;
        //this._ball.move.y *= 1 + gamepads.output.axes[1];
        this._updateBall(draw, gamepads, render, true, false);
      }
    }

    // Clamp movement speed to this._ball.speed
    let l = this._ball.move.length();
    l = MyMath.clamp(l, 0, this._ball.speed);
    this._ball.move.normalize();
    this._ball.move.multiply(l);
  }

  init = (user) => {
    this._terminated = false;
    this._user = user;
    this._controller_mode = 0;
    this._player = {
      xOffset: 10,
      model: new Point(15, 50),
      y: {
        left: this._swemu.screen.height / 2 + 50,
        right: this._swemu.screen.height / 2 - 50,
      },
      speed: 2.75,
      score: {
        left: 0,
        right: 0,
      },
      started: false,
      paused: false,
    };
    this._ball = {
      point: new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2),
      move: new Vector2D(Math.random() >= 0.5 ? 1 : -1, Math.random() - 0.5),
      speed: 1.9,
      radius: 6,
    }

    return this;
  }

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
    if (this._terminated) return;

    if (gamepads.used.axes.any) this._player.started = true;

    if (this._player.started) {
      this._updateBall(draw, gamepads, render);
      this._updatePlayers(draw, gamepads, render);
      this._checkHitbox(draw, gamepads, render); // call _updateBall in _checkHitbox to move ball further away
    } else {
    }

    this._renderPlayers(draw, gamepads, render);
    this._renderBall(draw, gamepads, render);
    this._renderScore(draw, gamepads, render);
  }
}
