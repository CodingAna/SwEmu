import { MyMath } from "../MyMath.js";
import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class HighwayRun {
  static get NAME() {return "HighwayRun";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;

    this._spawnCarLoopTimeout = setTimeout(() => {}, 1);
  }

  dpad_up = () => {
    if (!this._player.life.dead && this._player.started) this._player.position.lane--;
  }

  dpad_down = () => {
    if (!this._player.life.dead && this._player.started) this._player.position.lane++;
  }

  buttons_a = () => {
    if (this._player.life.dead)
      this.init();
  }

  buttons_b = () => {
    if (this._player.started) this.init(this._user);
    else this.terminate();
  }

  buttons_pause = () => {
    if (this._player.started && this._player.life.alive)
      this._player.paused = !this._player.paused;
  }

  _renderHighway = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    for (let i=1; i<this._highwayLanes; i++) {
      let y = (this._swemu.screen.height / this._highwayLanes) * i;
      if (i === 0) y += 1;
      if (i === this._highwayLanes) y -= 1;
      draw.dynamic.line(new Point(0, y), new Point(this._swemu.screen.width, y));
    }
  }

  _updateAnimalPositions = () => {}
  _renderAnimals = () => {}

  _spawnCar = () => {
    let carType = Math.random() <= 0.8 ? "Normal" : "SUV";

    let localWidth;
    let localLength;
    let speed = (Math.random() * 0.5) + 0.75; // 0.75 .. 1.25
    let fatalCrash; // fatalProbability = 1 - ((crashSpeed - minSpeed) / (maxSpeed - minSpeed))

    switch (carType) {
      case "Normal":
        localWidth = this._highwayLaneWidth * 0.55;
        localLength = this._highwayLaneWidth;
        speed -= 0.2; // 0.55 .. 1.05
        fatalCrash = speed >= 0.62; // 86%
        break;
      case "SUV":
        localWidth = this._highwayLaneWidth * 0.92;
        localLength = this._highwayLaneWidth * 1.65;
        speed += 0.1; // 0.85 .. 1.35
        fatalCrash = speed >= 0.88; // 94%
        break;
      default:
        return;
    }

    let lane = parseInt(Math.random() * this._highwayLanes);
    while (lane === this._carsLastLane)
      lane = parseInt(Math.random() * this._highwayLanes);
    this._carsLastLane = lane;

    if (this._buffers.cars[lane] === undefined) this._buffers.cars[lane] = [];
    this._buffers.cars[lane].push([this._swemu.screen.width, localWidth, localLength, speed, fatalCrash]);
  }
  _spawnCarLoop = () => {
    if (this._terminated) return;
    if (this._player.started && !this._player.paused && this._player.life.alive) this._spawnCar();
    // scaled time, 1000ms for each 360px mixed with speed up (.finalMultiplier)
    let out_multiplier = (1 + (this._player.savedAnimals / this._player.finalAnimals) * (this._player.finalMultiplier - 1));
    out_multiplier = out_multiplier > this._player.finalMultiplier ? this._player.finalMultiplier : out_multiplier;
    this._spawnCarLoopTimeout = setTimeout(() => {this._spawnCarLoop();}, (360 / (this._swemu.screen.height * out_multiplier)) * 1000);
  }
  _updateCarPositions = (draw, gamepads, render) => {
    for (let lane=0; lane<this._highwayLanes; lane++) {
      if (this._buffers.cars[lane] === undefined) continue;
      for (let i=0; i<this._buffers.cars[lane].length; i++) {
        if (this._buffers.cars[lane][i] === undefined) continue;
        let [x, localWidth, localLength, speed, fatalCrash] = this._buffers.cars[lane][i];
        let localSpeed = speed.valueOf();

        if (this._player.savedAnimals < this._player.finalAnimals) localSpeed *= 1 + ((this._player.savedAnimals / this._player.finalAnimals) * (this._player.finalMultiplier - 1));
        else localSpeed *= this._player.finalMultiplier;

        let moveDistance = localSpeed * render.deltaTime * 100;
        let distanceToCar = 15;
        // Cars cannot crash into each other
        if (i > 0 && this._buffers.cars[lane][i-1] !== undefined) {
          let [px, plocalWidth, plocalLength, pspeed, pfatalCrash] = this._buffers.cars[lane][i-1];
          if (x - moveDistance > px + plocalLength + distanceToCar)
            x -= moveDistance
        } else x -= moveDistance;

        if (x + localLength >= 0) this._buffers.cars[lane][i] = [x, localWidth, localLength, speed, fatalCrash];
        else delete this._buffers.cars[lane][i];
      } // for i
    } // for lane
  }
  _renderCars = (draw, gamepads, render) => {
    for (let lane=0; lane<this._highwayLanes; lane++) {
      if (this._buffers.cars[lane] === undefined) continue;
      for (let i=0; i<this._buffers.cars[lane].length; i++) {
        if (this._buffers.cars[lane][i] === undefined) continue;
        let [x, localWidth, localLength, speed, fatalCrash] = this._buffers.cars[lane][i];
        let y = (this._swemu.screen.height / this._highwayLanes) * lane + ((this._swemu.screen.height / this._highwayLanes) / 2);

        let p1 = new Point(x, y-(localWidth / 2));
        let p2 = new Point(localLength, localWidth).add(p1);

        if (fatalCrash) draw.dynamic.setColor("ff4444");
        else draw.dynamic.setColor("ffffff");
        draw.dynamic.rect(p1, p2);
      } // for i
    } // for lane
  }

  _updatePlayerPosition = (draw, gamepads, render) => {
    if (!gamepads.player1.joystick.used.right) return;

    this._player.move = new Vector2D(gamepads.player1.joystick.right.y, 0).multiply(this._player.speed.current).multiply(render.deltaTime).multiply(100);
    //this._player.position.future.x = this._player.position.current.add_NW(this._player.move.point()).x;
    this._player.position.future.x += this._player.move.x;

    this._player.position.future.y = (this._swemu.screen.height / this._highwayLanes) * this._player.position.lane + ((this._swemu.screen.height / this._highwayLanes) / 2);
    this._player.position.current.y = this._player.position.future.y;

    for (let i=0; this._buffers.cars[this._player.position.lane] !== undefined && i<this._buffers.cars[this._player.position.lane].length; i++) {
      if (this._buffers.cars[this._player.position.lane][i] === undefined) continue;
      let [x, localWidth, localLength, speed, fatalCrash] = this._buffers.cars[this._player.position.lane][i];

      let inX = this._player.position.future.x + this._player.radius > x && this._player.position.future.x - this._player.radius < x + localLength;

      if (fatalCrash) {
        if (inX) {
          if (this._player.move.x < 0 && this._player.position.current.x - this._player.radius > x + localLength) {
            this._player.position.future.x = this._player.position.current.x;
          } else {
            this._player.life.dead = true;
            this._player.life.alive = false;
            // Maybe just use i and use the reference later?
            this._player.life.killer = this._buffers.cars[this._player.position.lane][i];
          }
        }
      } else if (inX) {
        if (this._player.position.lane === this._highwayLanes - 1) this._player.position.lane--;
        else if (this._player.position.lane === 0) this._player.position.lane++;
        else this._player.position.lane += Math.random() >= 0.5 ? 1 : -1;
      }
    }

    if (this._player.position.future.x + this._player.radius <= this._swemu.screen.width)
      this._player.position.current.x = this._player.position.future.x;
    if (this._player.position.future.x - this._player.radius < 0)
      this._player.position.current.x = this._player.radius;
  }
  _renderPlayer = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    draw.dynamic.arc(this._player.position.current, this._player.radius);

    if (gamepads.player1.joystick.used.right) {
      draw.dynamic.setColor("ff5522");
      draw.dynamic.line(this._player.position.current, new Vector2D(gamepads.player1.joystick.right.y, 0).multiply(100).point().add(this._player.position.current));
    }
  }

  init = (user) => {
    this._terminated = false;
    this._user = user;
    this._highwayLanes = 7;
    this._highwayLaneWidth = (this._swemu.screen.height / this._highwayLanes);
    this._player = {
      life: {
        alive: true,
        dead: false,
        killer: [],
        killerColors: [],
      },
      position: {
        lane: parseInt((this._highwayLanes - 1) / 2),
        current: new Point(100, 100),
        future: new Point(100, 100),
      },
      move: new Vector2D(),
      radius: 10,
      speed: {
        current: 0.8,
        init: 0.8,
        max: 2,
      },
      newHighscore: false,
      newHighscoreShowUntil: 0,
      savedAnimals: 0,
      finalAnimals: 40,
      finalMultiplier: 1.8,
      started: false,
      paused: false,
    };
    this._buffers = {
      animals: [],
      cars: [],
    }
    this._carsLastLane = -1;
    this._gamepad_swiped = false;
    this._gamepad_swipe_t = 0;
    clearTimeout(this._spawnCarLoopTimeout);
    this._spawnCarLoop();

    this._player.position.future.y = (this._swemu.screen.height / this._highwayLanes) * this._player.position.lane + ((this._swemu.screen.height / this._highwayLanes) / 2);
    this._player.position.current.y = this._player.position.future.y;

    return this;
  }

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
    if (this._terminated) return;

    if (gamepads.player1.joystick.used.right) this._player.started = true;

    if (this._player.position.lane > this._highwayLanes - 1) this._player.position.lane = this._highwayLanes - 1;
    else if (this._player.position.lane < 0) this._player.position.lane = 0;

    this._renderHighway(draw, gamepads, render);

    if (this._player.started) {
      if (this._player.paused) {
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text("Paused", new Point(this._swemu.screen.width / 2 - 25, this._swemu.screen.height / 2 - 70), 35, null, "bold", true);
        draw.dynamic.setColor("b0b0b0");
        draw.dynamic.text("Press again to continue", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);
      } else {
        if (this._player.life.alive) {
          this._updateAnimalPositions();
          this._renderAnimals();

          this._updateCarPositions(draw, gamepads, render);
          this._renderCars(draw, gamepads, render);

          this._updatePlayerPosition(draw, gamepads, render);
        } else {
          draw.dynamic.setColor("ffffff");
          draw.dynamic.text("Game over", new Point(this._swemu.screen.width / 2 - 25, this._swemu.screen.height / 2 - 70), 35, null, "bold", true);
          draw.dynamic.setColor("b0b0b0");
          draw.dynamic.text("Press A to restart", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);

          draw.dynamic.setColor("ffa8a8");
          let [x, lane, carType, scrollSpeed] = this._player.life.killer;
          let y = (this._swemu.screen.height / this._highwayLanes) * lane + ((this._swemu.screen.height / this._highwayLanes) / 2);
          let width = carType === "SUV" ? this._highwayLaneWidth*1.65 : (carType === "Normal" ? this._highwayLaneWidth : 200);
          let height = carType === "SUV" ? this._highwayLaneWidth*0.92 : (carType === "Normal" ? this._highwayLaneWidth*0.55 : 120);

          let p1 = new Point(x, y-(height / 2));
          let p2 = new Point(width, height).add(p1);

          draw.dynamic.setColor("ffffff");
          draw.dynamic.rect(p1, p2);
        }
      }
      this._renderPlayer(draw, gamepads, render);
    } else {
      this._renderPlayer(draw, gamepads, render);

      draw.dynamic.setColor("ffffff");
      draw.dynamic.text("Move to start", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);
    }
  }
}
