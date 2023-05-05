import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class CoinCollect {
  static get NAME() {return "CoinCollect";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._player = {};
    this._buffers = {};

    this._spawnObstacleLoopTimeout = setTimeout(() => {}, 1);
    this._spawnCoinLoopTimeout = setTimeout(() => {}, 1);
  }

  // Combining update and render would speed up the main renderer due to only one full loop interation instead of two
  _spawnObstacle = () => {
    let height = (Math.random() * 15) + 10;
    let width = (Math.random() * 30) + 15;
    let y = Math.random() * (this._swemu.screen.height - height);
    let scrollSpeed = (Math.random() * 0.5) + 0.75;
    this._buffers.obstacles.push([new Point(this._swemu.screen.width, y), width, height, scrollSpeed]);
  }
  _updateObstacles = (draw, gamepads, render) => {
    for (let i=0; i<this._buffers.obstacles.length; i++) {
      if (this._buffers.obstacles[i] === undefined) continue;
      let [p1, width, height, scrollSpeed] = this._buffers.obstacles[i];
      let localScrollSpeed = scrollSpeed.valueOf();

      if (this._player.coins < this._player.finalCoins) localScrollSpeed *= 1 + ((this._player.coins / this._player.finalCoins) * (this._player.finalMultiplier - 1));
      else localScrollSpeed *= this._player.finalMultiplier;

      p1.x -= localScrollSpeed * render.deltaTime * 100;
      let p2 = new Point(width, 0).add(p1);
      let p3 = new Point(0, height).add(p2);

      if (p2.x >= 0) this._buffers.obstacles[i] = [p1, width, height, scrollSpeed];
      else delete this._buffers.obstacles[i];

      let inX = this._player.position.current.x + this._player.radius > p1.x && this._player.position.current.x - this._player.radius < p2.x;
      let inY = this._player.position.current.y + this._player.radius > p2.y && this._player.position.current.y - this._player.radius < p3.y;

      if (inX && inY) {
        this._player.life.dead = true;
        this._player.life.alive = false;
        // Maybe just use i and use the reference later?
        this._player.life.killer = this._buffers.obstacles[i];
      }
    }
  }
  _renderObstacles = (draw, gamepads, render) => {
    for (let i=0; i<this._buffers.obstacles.length; i++) {
      if (this._buffers.obstacles[i] === undefined) continue;
      let [p1, width, height, scrollSpeed] = this._buffers.obstacles[i];

      let p2 = new Point(width, height).add(p1);

      draw.dynamic.setColor("ffffff");
      draw.dynamic.rect(p1, p2);
    }
  }

  _spawnCoin = () => {
    let radius = 15;
    let y = Math.random() * (this._swemu.screen.height - (radius * 2));
    let scrollSpeed = (Math.random() * 0.5) + 0.5;
    this._buffers.coins.push([new Point(this._swemu.screen.width + radius, y), radius, scrollSpeed]);
  }
  _updateCoins = (draw, gamepads, render) => {
    for (let i=0; i<this._buffers.coins.length; i++) {
      if (this._buffers.coins[i] === undefined) continue;
      let [center, radius, scrollSpeed] = this._buffers.coins[i];
      let localScrollSpeed = scrollSpeed.valueOf();

      if (this._player.coins < this._player.finalCoins) localScrollSpeed *= 1 + ((this._player.coins / this._player.finalCoins) * (this._player.finalMultiplier - 1));
      else localScrollSpeed *= this._player.finalMultiplier;

      center.x -= localScrollSpeed * render.deltaTime * 100;

      if (center.x + radius >= 0) this._buffers.coins[i] = [center, radius, scrollSpeed];
      else delete this._buffers.coins[i];

      let twoCenterVecLen = new Vector2D(this._player.position.current, center).length();
      if (twoCenterVecLen < this._player.radius + radius) {
        delete this._buffers.coins[i];
        this._player.coins++;
        if (this._player.coins > getCookie("coinHighscore")) {
          if (!this._player.newHighscore) this._player.newHighscoreShowUntil = Date.now() + 1500; // Show "New Highscore!" hint for 1500ms
          setCookie("coinHighscore", this._player.coins, 7);
          this._player.newHighscore = true;
        }
      }
    }
  }
  _renderCoins = (draw, gamepads, render) => {
    for (let i=0; i<this._buffers.coins.length; i++) {
      if (this._buffers.coins[i] === undefined) continue;
      let [center, radius, scrollSpeed] = this._buffers.coins[i];

      draw.dynamic.setColor("dbcb20");
      draw.dynamic.arc(center, radius, true);
      draw.dynamic.setColor("000000");
      draw.dynamic.text("C", new Point(-7, 8).add(center), 16)
    }
  }
  _renderHighscore = (draw, gamepads, render) => {
    let coinHighscore = getCookie("coinHighscore");
    if (coinHighscore > 0) {
      draw.dynamic.setColor("dbcb20");
      draw.dynamic.text("Highscore: " + coinHighscore, new Point(10, 30), 20);
    }
  }

  _moveToFuturePlayerPosition = (draw, gamepads, render) => {
    if (!gamepads.used.axes.left) return;

    this._player.move = new Vector2D(gamepads.output.axes[0], gamepads.output.axes[1]).multiply(this._player.speed.current).multiply(render.deltaTime).multiply(100);
    this._player.position.future = this._player.position.current.add_NW(this._player.move.point());

    if (this._player.position.future.x - this._player.radius >= 0 && this._player.position.future.x + this._player.radius <= this._swemu.screen.width) this._player.position.current.x = this._player.position.future.x;
    if (this._player.position.future.y - this._player.radius >= 0 && this._player.position.future.y + this._player.radius <= this._swemu.screen.height) this._player.position.current.y = this._player.position.future.y;

    if (this._player.position.future.x - this._player.radius < 0) this._player.position.current.x = this._player.radius;
    if (this._player.position.future.x + this._player.radius > this._swemu.screen.width) this._player.position.current.x = this._swemu.screen.width - this._player.radius;

    if (this._player.position.future.y - this._player.radius < 0) this._player.position.current.y = this._player.radius;
    if (this._player.position.future.y + this._player.radius > this._swemu.screen.height) this._player.position.current.y = this._swemu.screen.height - this._player.radius;
  }
  // _checkPlayerHitbox = () => {} // TODO
  _renderPlayer = (draw, gamepads, render) => {
    draw.dynamic.setColor("ffffff");
    draw.dynamic.arc(this._player.position.current, this._player.radius);

    if (gamepads.used.axes.left) {
      draw.dynamic.setColor("ff5522");
      draw.dynamic.line(this._player.position.current, new Vector2D(gamepads.output.axes[0], gamepads.output.axes[1]).multiply(100).point().add(this._player.position.current));
    }
  }

  _spawnObstacleLoop = () => {
    if (this._terminated) return;
    if (this._player.started && !this._player.paused && this._player.life.alive) this._spawnObstacle();
    // scaled time, 500ms for each 360px mixed with speed up (.finalMultiplier)
    let out_multiplier = (1 + (this._player.coins / this._player.finalCoins) * (this._player.finalMultiplier - 1));
    out_multiplier = out_multiplier > this._player.finalMultiplier ? this._player.finalMultiplier : out_multiplier;
    this._spawnObstacleLoopTimeout = setTimeout(() => {this._spawnObstacleLoop();}, (360 / (this._swemu.screen.height * out_multiplier)) * 500);
  }
  _spawnCoinLoop = () => {
    if (this._terminated) return;
    if (this._player.started && !this._player.paused && this._player.life.alive) this._spawnCoin();
    // scaled time, 1800ms for each 360px mixed with speed up (.finalMultiplier)
    let out_multiplier = (1 + (this._player.coins / this._player.finalCoins) * (this._player.finalMultiplier - 1));
    out_multiplier = out_multiplier > this._player.finalMultiplier ? this._player.finalMultiplier : out_multiplier;
    this._spawnCoinLoopTimeout = setTimeout(() => {this._spawnCoinLoop();}, (360 / (this._swemu.screen.height * out_multiplier)) * 1800);
  }

  initGame = () => {
    this._terminated = false;
    this._player = {
      life: {
        alive: true,
        dead: false,
        killer: [],
        killerColors: [],
      },
      position: {
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
    this._buffers = {
      obstacles: [],
      coins: [],
    }
    clearTimeout(this._spawnObstacleLoopTimeout);
    clearTimeout(this._spawnCoinLoopTimeout);
    this._spawnObstacleLoop();
    this._spawnCoinLoop();

    return this;
  }

  terminateGame = () => {
    this._terminated = true;

    return this;
  }

  renderGame = (draw, gamepads, render) => {
    if (this._terminated) return;

    //if (gamepads.output.axes[0] != 0 || gamepads.output.axes[1] != 0) this._player.started = true;
    if (gamepads.used.axes.left) this._player.started = true;

    // NOTE: This gives the Application/Game full access to the gamepad actions (overwriting data => "exclusive gamepad access" for *active* app)
    //       Maybe store gamepads.actions.* in a local variable instead of the gamepad's to ensure data access is granted to the specific application
    // Read GamePad button data (paused, south(A), east (B))

    /*
    // Either do this for each game individually (and maybe different buttons / in-game actions) or via main?
    if (gamepads.output.buttons.east.pressed) {
      if (!gamepads.actions.east)
        this.terminateGame();
      gamepads.actions.east = true;
    } else gamepads.actions.east = false;
    */

    if (gamepads.output.buttons.south.pressed) {
      if (!gamepads.actions.south && this._player.life.dead)
        this.initGame();
        //location.reload();
      gamepads.actions.south = true;
    } else gamepads.actions.south = false;

    if (gamepads.output.buttons.pause.pressed) {
      if (!gamepads.actions.pause)
        if (this._player.started && this._player.life.alive)
          this._player.paused = !this._player.paused;
      gamepads.actions.pause = true;
    } else gamepads.actions.pause = false;

    if (this._player.started) {
      if (this._player.newHighscoreShowUntil >= Date.now()) {
        draw.dynamic.setColor("dbcb20");
        draw.dynamic.text("New Highscore!", new Point(this._swemu.screen.width/2, 30), 20, null, null, true);
      }

      if (this._player.paused) {
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text("Paused", new Point(this._swemu.screen.width / 2 - 25, this._swemu.screen.height / 2 - 70), 35, null, "bold", true);
        draw.dynamic.setColor("b0b0b0");
        draw.dynamic.text("Press again to continue", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);

        this._renderHighscore(draw, gamepads, render);
      } else {
        if (this._player.life.alive) {
          this._updateCoins(draw, gamepads, render);
          this._renderCoins(draw, gamepads, render);
          this._updateObstacles(draw, gamepads, render);
          this._renderObstacles(draw, gamepads, render);

          this._moveToFuturePlayerPosition(draw, gamepads, render); // Update .future and push them eventually into .current
          // checkPlayerHitbox(); // Check current and .future values and reset the latter if invalid (hitbox check === true)
        } else {
          draw.dynamic.setColor("ffffff");
          draw.dynamic.text("Game over", new Point(this._swemu.screen.width / 2 - 25, this._swemu.screen.height / 2 - 70), 35, null, "bold", true);
          draw.dynamic.setColor("b0b0b0");
          draw.dynamic.text("Press A to restart", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);

          draw.dynamic.setColor("ffa8a8");
          let [p1, width, height, scrollSpeed] = this._player.life.killer;
          draw.dynamic.rect(p1, new Point(width, height).add(p1));
        }
        this._renderPlayer(draw, gamepads, render);
        // Render coin count
        draw.dynamic.setColor("dbcb20");
        draw.dynamic.text(this._player.coins + " Coin" + (this._player.coins === 1 ? "" : "s"), new Point(10, 30), 20);
      }
    } else {
      this._renderPlayer(draw, gamepads, render);

      draw.dynamic.setColor("ffffff");
      draw.dynamic.text("Move to start", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);

      this._renderHighscore(draw, gamepads, render);
    }
  }
}
