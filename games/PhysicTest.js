import { MyMath } from "../MyMath.js";
import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class PhysicTest {
  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._player = {};
  }

  _moveToFuturePlayerPosition = (draw, gamepads, render) => {
    let lastAirActionDiff = (Date.now() - this._player.lastAirAction) + 300;

    this._player.move.x = gamepads.output.axes[0] * this._player.speed.current * render.deltaTime * 100;
    this._player.move.y += 9.81 * (MyMath.exp(lastAirActionDiff / 1000, 2)) * render.deltaTime;

    if (gamepads.output.buttons.south.pressed) {
      if (!gamepads.actions.south) {
        // If not above limit OR distance to ground <= player diameter (=> user doesn't have to wait to actually touch the ground)
        if (this._player.jumps < this._player.jumpLimit || this._swemu.screen.height - this._player.position.current.y <= this._player.radius*2) {
          this._player.jumps++;
          if (this._player.move.y > 0) this._player.move.y = 0;
          this._player.move.add(new Vector2D(0, -1).multiply(this._player.jumpForce).multiply(100).multiply(render.deltaTime));
          this._player.lastAirAction = Date.now() - 300;
        }
      }
      gamepads.actions.south = true;
    } else gamepads.actions.south = false;

    // Clamp vertical upwards (jump) velocity
    if (this._player.move.y < -this._player.forceLimit) this._player.move.y = -this._player.forceLimit;

    this._player.position.future = this._player.position.current.add_NW(this._player.move.point());
    //this._player.position.future.y += (9.81 * MyMath.exp(lastAirActionDiff/1000, 2)) / 2;
    // This doesn't modify the players .move vector, I didn't like it

    // Update player position inside of screen
    // x & y
    if (this._player.position.future.x - this._player.radius >= 0 && this._player.position.future.x + this._player.radius <= this._swemu.screen.width) this._player.position.current.x = this._player.position.future.x;
    if (this._player.position.future.y - this._player.radius >= 0 && this._player.position.future.y + this._player.radius <= this._swemu.screen.height) this._player.position.current.y = this._player.position.future.y;

    // Clamp player position to screen border
    // x
    if (this._player.position.future.x - this._player.radius < 0) this._player.position.current.x = this._player.radius;
    if (this._player.position.future.x + this._player.radius > this._swemu.screen.width) this._player.position.current.x = this._swemu.screen.width - this._player.radius;

    // y
    if (this._player.position.future.y - this._player.radius < 0) {
      this._player.position.current.y = this._player.radius
      this._player.move.y = -this._player.move.y;
    };
    if (this._player.position.future.y + this._player.radius > this._swemu.screen.height) {
      this._player.position.current.y = this._swemu.screen.height - this._player.radius;
      // Player touched the ground => Reset fall timer &=> gravity calculation
      this._player.lastAirAction = Date.now();
      this._player.move.y = 0;
      this._player.jumps = 0;
    }
  }
  _renderPlayer = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    draw.dynamic.arc(this._player.position.current, this._player.radius);

    if (gamepads.used) {
      draw.dynamic.setColor("ff5522");
      draw.dynamic.line(this._player.position.current, new Vector2D(gamepads.output.axes[0], gamepads.output.axes[1]).multiply(100).point().add(this._player.position.current));
    }
  }
  initGame = () => {
    this._terminated = false;
    this._player = {
      life: {
        alive: true,
        dead: false,
      },
      position: {
        current: new Point(100, 100),
        future: new Point(100, 100),
      },
      move: new Vector2D(),
      jumps: 0,
      jumpLimit: 2,
      jumpForce: 2.9,
      forceLimit: 3.4,
      lastAirAction: Date.now(),
      radius: 10,
      speed: {
        current: 2.25,
        init: 2.25,
        max: 3,
      },
      started: false,
      paused: false,
    };

    return this;
  }

  terminateGame = () => {
    this._terminated = true;
    // this = null; // Is this even possible?
    return null; // this
  }

  renderGame = (draw, gamepads, render) => {
    if (this._terminated) return;

    if (gamepads.output.axes[0] != 0 || gamepads.output.axes[1] != 0) this._player.started = true;

    this._moveToFuturePlayerPosition(draw, gamepads, render);
    this._renderPlayer(draw, gamepads, render);
  }
}
