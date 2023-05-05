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

  _renderHighway = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    for (let i=0; i<=this._highwayLanes; i++) {
      let y = (this._swemu.screen.height / this._highwayLanes) * i;
      if (i === 0) y += 1;
      if (i === this._highwayLanes) y -= 1;
      draw.dynamic.line(new Point(0, y), new Point(this._swemu.screen.width, y));
    }
  }

  _updateAnimalPositions = () => {}
  _renderAnimals = () => {}

  _spawnCar = () => {
    let lane = parseInt(Math.random() * this._highwayLanes);
    while (lane === this._carsLastLane)
      lane = parseInt(Math.random() * this._highwayLanes);
    this._carsLastLane = lane;
    let carType = Math.random() >= 0.8 ? "SUV" : "Normal";
    let scrollSpeed = (Math.random() * 0.5) + 0.75;
    let fatalSpeed = carType === "SUV" ? 0.8 : (carType === "Normal" ? 1 : 0);
    let fatalCrash = scrollSpeed >= fatalSpeed;
    if (!fatalCrash) if (Math.random() > 0.6) fatalCrash = true;
    this._buffers.cars.push([this._swemu.screen.width, lane, carType, scrollSpeed, fatalCrash]);
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
    for (let i=0; i<this._buffers.cars.length; i++) {
      if (this._buffers.cars[i] === undefined) continue;
      let [x, lane, carType, scrollSpeed, fatalCrash] = this._buffers.cars[i];
      //let y = (this._swemu.screen.height / this._highwayLanes) * lane + ((this._swemu.screen.height / this._highwayLanes) / 2);
      let localScrollSpeed = scrollSpeed.valueOf();
      let width = carType === "SUV" ? this._highwayLaneWidth*1.65 : (carType === "Normal" ? this._highwayLaneWidth : 200);

      if (this._player.savedAnimals < this._player.finalAnimals) localScrollSpeed *= 1 + ((this._player.savedAnimals / this._player.finalAnimals) * (this._player.finalMultiplier - 1));
      else localScrollSpeed *= this._player.finalMultiplier;

      x -= localScrollSpeed * render.deltaTime * 100;
      let x2 = x + width;

      if (x2 >= 0) this._buffers.cars[i] = [x, lane, carType, scrollSpeed, fatalCrash];
      else delete this._buffers.cars[i];

      if (fatalCrash) {
        let inX = this._player.position.current.x + this._player.radius > x && this._player.position.current.x - this._player.radius < x2;
        let inY = this._player.position.lane === lane;

        if (inX && inY) {
          this._player.life.dead = true;
          this._player.life.alive = false;
          // Maybe just use i and use the reference later?
          this._player.life.killer = this._buffers.cars[i];
        }
      }
    }
  }
  _renderCars = (draw, gamepads, render) => {
    for (let i=0; i<this._buffers.cars.length; i++) {
      if (this._buffers.cars[i] === undefined) continue;
      let [x, lane, carType, scrollSpeed] = this._buffers.cars[i];
      let y = (this._swemu.screen.height / this._highwayLanes) * lane + ((this._swemu.screen.height / this._highwayLanes) / 2);
      let width = carType === "SUV" ? this._highwayLaneWidth*1.65 : (carType === "Normal" ? this._highwayLaneWidth : 200);
      let height = carType === "SUV" ? this._highwayLaneWidth*0.92 : (carType === "Normal" ? this._highwayLaneWidth*0.55 : 120);

      let p1 = new Point(x, y-(height / 2));
      let p2 = new Point(width, height).add(p1);

      draw.dynamic.setColor("ffffff");
      draw.dynamic.rect(p1, p2);
    }
  }

  _updatePlayerPosition = (draw, gamepads, render) => {
    if (!gamepads.used.axes.left && !gamepads.used.buttons) return;

    this._player.move = new Vector2D(gamepads.output.axes[0], 0).multiply(this._player.speed.current).multiply(render.deltaTime).multiply(100);
    this._player.position.future.x = this._player.position.current.add_NW(this._player.move.point()).x;

    // Commented code is for joystick up/down control, kinda funky tho => use of buttons (Y north, A south) instead (in renderGame)
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

    if (gamepads.used.axes.left) {
      draw.dynamic.setColor("ff5522");
      draw.dynamic.line(this._player.position.current, new Vector2D(gamepads.output.axes[0], 0).multiply(100).point().add(this._player.position.current));
    }
  }

  initGame = () => {
    this._terminated = false;
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

  terminateGame = () => {
    this._terminated = true;

    return this;
  }

  renderGame = (draw, gamepads, render) => {
    if (this._terminated) return;

    if (gamepads.used.axes.left) this._player.started = true;

    if (gamepads.output.buttons.north.pressed) {
      if (!gamepads.actions.north)
        if (this._player.life.dead)
          ;
        else if (this._player.started) this._player.position.lane--;
      gamepads.actions.north = true;
    } else gamepads.actions.north = false;

    if (gamepads.output.buttons.south.pressed) {
      if (!gamepads.actions.south) {
        if (this._player.life.dead)
          this.initGame();
        else if (this._player.started) this._player.position.lane++;
      }
      gamepads.actions.south = true;
    } else gamepads.actions.south = false;

    if (gamepads.output.buttons.pause.pressed) {
      if (!gamepads.actions.pause)
        if (this._player.started && this._player.life.alive)
          this._player.paused = !this._player.paused;
      gamepads.actions.pause = true;
    } else gamepads.actions.pause = false;

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
