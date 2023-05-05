import { MyMath } from "../MyMath.js";
import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class HighwayRun {
  static get NAME() {return "HighwayRun";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
  }

  _renderHighway = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    for (let i=0; i<=this._highwayLanes; i++) {
      let y = (this._swemu.screen.height / this._highwayLanes) * i;
      if (i === 0) y += 1;
      if (i === this._highwayLanes) y -= 1;
      draw.dynamic.line(new Point(0, y), new Point(this._swemu.screen.width, y));
    }
  }

  _updateCarPositions = () => {}
  _renderCars = () => {}

  _updatePlayerPosition = (draw, gamepads, render) => {
    if (!gamepads.used) return;

    this._player.move = new Vector2D(gamepads.output.axes[0], 0).multiply(this._player.speed.current).multiply(render.deltaTime).multiply(100);
    this._player.position.future.x = this._player.position.current.add_NW(this._player.move.point()).x;

    // Commented code is for joystick up/down control, kinda funky tho => use of buttons (Y north, A south) instead
    /*
    let gpOx = gamepads.output.axes[1];
    let gpOxTresh = 0.35;
    let swipeHoldTime = 0.18;
    if (MyMath.abs(gpOx) < gpOxTresh / 2 || Date.now() - this._gamepad_swipe_t >= swipeHoldTime * 1000) {
      this._gamepad_swiped = false; // Make swipe available again after being below a certain threshold
      this._gamepad_swipe_t = Date.now();
    }
    if (!this._gamepad_swiped) {
      if (gpOx >= gpOxTresh) {
        this._player.position.lane++;
        this._gamepad_swiped = true;
      } else if (gpOx <= -gpOxTresh) {
        this._player.position.lane--;
        this._gamepad_swiped = true;
      }
      if (this._player.position.lane > this._highwayLanes - 1) this._player.position.lane = this._highwayLanes - 1;
      else if (this._player.position.lane < 0) this._player.position.lane = 0;
    }
    */
    if (gamepads.output.buttons.south.pressed) {
      if (!gamepads.actions.south)
        this._player.position.lane++;
      gamepads.actions.south = true;
    } else {
      gamepads.actions.south = false;
    }

    if (gamepads.output.buttons.north.pressed) {
      if (!gamepads.actions.north)
        this._player.position.lane--;
      gamepads.actions.north = true;
    } else gamepads.actions.north = false;

    if (this._player.position.lane > this._highwayLanes - 1) this._player.position.lane = this._highwayLanes - 1;
    else if (this._player.position.lane < 0) this._player.position.lane = 0;

    this._player.position.future.y = (this._swemu.screen.height / this._highwayLanes) * this._player.position.lane + ((this._swemu.screen.height / this._highwayLanes) / 2);

    if (this._player.position.future.x - this._player.radius >= 0 && this._player.position.future.x + this._player.radius <= this._swemu.screen.width) this._player.position.current.x = this._player.position.future.x;
    if (this._player.position.future.y - this._player.radius >= 0 && this._player.position.future.y + this._player.radius <= this._swemu.screen.height) this._player.position.current.y = this._player.position.future.y;

    if (this._player.position.future.x - this._player.radius < 0) this._player.position.current.x = this._player.radius;
    if (this._player.position.future.x + this._player.radius > this._swemu.screen.width) this._player.position.current.x = this._swemu.screen.width - this._player.radius;

    if (this._player.position.future.y - this._player.radius < 0) this._player.position.current.y = this._player.radius;
    if (this._player.position.future.y + this._player.radius > this._swemu.screen.height) this._player.position.current.y = this._swemu.screen.height - this._player.radius;
  }
  _renderPlayer = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    draw.dynamic.arc(this._player.position.current, this._player.radius);

    if (gamepads.used) {
      draw.dynamic.setColor("ff5522");
      draw.dynamic.line(this._player.position.current, new Vector2D(gamepads.output.axes[0], 0).multiply(100).point().add(this._player.position.current));
    }
  }

  initGame = () => {
    this._terminated = false;
    this._highwayLanes = 7;
    this._player = {
      life: {
        alive: true,
        dead: false,
        killer: [],
        killerColors: [],
      },
      position: {
        lane: 0,
        current: new Point(100, 100),
        future: new Point(100, 100),
      },
      move: new Vector2D(),
      radius: 10,
      speed: {
        current: 2.25,
        init: 2.25,
        max: 3,
      },
      newHighscore: false,
      newHighscoreShowUntil: 0,
      coins: 0,
      finalCoins: 40,
      finalMultiplier: 1.8,
      started: false,
      paused: false,
    };
    this._gamepad_swiped = false;
    this._gamepad_swipe_t = 0;

    return this;
  }

  terminateGame = () => {
    this._terminated = true;

    return this;
  }

  renderGame = (draw, gamepads, render) => {
    if (this._terminated) return;

    if (gamepads.output.axes[0] != 0 || gamepads.output.axes[1] != 0) this._player.started = true;

    this._renderHighway(draw, gamepads, render);

    if (this._player.started) {
      if (this._player.paused) {
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text("Press again to continue", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);
      } else {
        this._updateCarPositions();
        this._renderCars();

        this._updatePlayerPosition(draw, gamepads, render);
        this._renderPlayer(draw, gamepads, render);
      }
    }
  }
}
