import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class CoinCollect {
  static get NAME() {return "CoinCollect";}

  constructor(swemu, showNotification, showKeyboard) {
    this._swemu = swemu;
    this._showNotification = showNotification;
    this._showKeyboard = showKeyboard;

    this._spawnObstacleLoopTimeout = setTimeout(() => {}, 1);
    this._spawnCoinLoopTimeout = setTimeout(() => {}, 1);
  }

  buttons_a = () => {
    if (this._player.life.dead) this.init(this._user);
  }

  buttons_b = () => {
    if (this._player.started) this.init(this._user);
    else this.terminate();
  }

  buttons_pause = () => {
    if (this._player.life.alive) this._player.paused = !this._player.paused;
  }

  // Combining update and render would speed up the main renderer due to only one full loop interation instead of two
  _spawnObstacle = () => {
    let scrollSpeed = (Math.random() * 0.5) + 0.75; // 0.25 .. 1.25
    //let height = (Math.random() * 15) + 10;
    let height = 10 + (10 * (scrollSpeed - 0.25)) + (5 * Math.random());
    //let width = (Math.random() * 30) + 15;
    let width = 15 + (20 * (scrollSpeed - 0.25)) + (10 * Math.random());
    let y = Math.random() * (this._swemu.screen.height - height);
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

      draw.setColor("ef1a48");
      draw.rect(p1, p2);
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
        if (this._player.coins > getCookie("coinHighscore_" + this._user.uid)) {
          if (!this._player.newHighscore)
            this._player.newHighscoreShowUntil = Date.now() + 1500; // Show "New Highscore!" hint for 1500ms
          setCookie("coinHighscore_" + this._user.uid, this._player.coins, 7);
          this._player.newHighscore = true;
        }
      }
    }
  }
  _renderCoins = (draw, gamepads, render) => {
    for (let i=0; i<this._buffers.coins.length; i++) {
      if (this._buffers.coins[i] === undefined) continue;
      let [center, radius, scrollSpeed] = this._buffers.coins[i];

      draw.setColor("dbcb20");
      draw.arc(center, radius, true);
      draw.setColor("000000");
      draw.text("C", new Point(-7, 8).add(center), 16)
    }
  }
  _renderHighscore = (draw, gamepads, render) => {
    let coinHighscore = getCookie("coinHighscore_" + this._user.uid);
    if (coinHighscore > 0) {
      draw.setColor("dbcb20");
      draw.text("Highscore: " + coinHighscore, new Point(10, 30), 20);
    }
  }

  _moveToFuturePlayerPosition = (draw, gamepads, render) => {
    if (!gamepads.player1.joystick.used.left) return;

    // check mode == 1 then normalize gamepad vector

    this._player.move = new Vector2D(gamepads.player1.joystick.left.x, gamepads.player1.joystick.left.y).multiply(this._player.speed.current).multiply(render.deltaTime).multiply(100);
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
    draw.setColor("ffffff");
    draw.arc(this._player.position.current, this._player.radius);

    if (gamepads.player1.joystick.used.left) {
      draw.setColor("ff5522");
      draw.line(this._player.position.current, new Vector2D(gamepads.player1.joystick.left.x, gamepads.player1.joystick.left.y).multiply(100).point().add(this._player.position.current));
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

  init = (user) => {
    this._terminated = false;
    this._user = user;
    this._mode = 0;
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
        max: 3.2,
      },
      newHighscore: false,
      newHighscoreShowUntil: 0,
      coins: 0,
      finalCoins: 55,
      finalMultiplier: 2.15,
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

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
    if (this._terminated) return;

    if (gamepads.player1.joystick.used.left) this._player.started = true;

    if (this._player.started) {
      if (this._player.newHighscoreShowUntil >= Date.now()) {
        draw.setColor("dbcb20");
        draw.text("New Highscore!", new Point(this._swemu.screen.width/2, 30), 20, null, null, true);
      }

      if (this._player.paused) {
        draw.setColor("ffffff");
        draw.text("Paused", new Point(this._swemu.screen.width / 2 - 25, this._swemu.screen.height / 2 - 70), 35, null, "bold", true);
        draw.setColor("b0b0b0");
        draw.text("Press again to continue", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);

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
          this._renderPlayer(draw, gamepads, render);

          draw.setColor("ef1a48");
          let [p1, width, height, scrollSpeed] = this._player.life.killer;
          draw.rect(p1, new Point(width, height).add(p1));

          draw.setColor("ffffff");
          draw.text("Game over", new Point(this._swemu.screen.width / 2 - 25, this._swemu.screen.height / 2 - 70), 35, null, "bold", true);
          draw.setColor("b0b0b0");
          draw.text("Press A to restart", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);
        }
        if (!this._player.life.dead) this._renderPlayer(draw, gamepads, render);
        // Render coin count
        draw.setColor("dbcb20");
        draw.text(this._player.coins + " Coin" + (this._player.coins === 1 ? "" : "s"), new Point(10, 30), 20);
      }
    } else {
      this._renderPlayer(draw, gamepads, render);

      draw.setColor("ffffff");
      draw.text("Move to start", new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2), 18, null, null, true);

      this._renderHighscore(draw, gamepads, render);
    }
  }
}
