import { MyMath } from "../MyMath.js";
import { NetworkConnection } from "../OS.js";
import { Utils } from "../Utils.js";
import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class Pong {
  static get NAME() {return "Pong";}

  constructor(swemu) {
    this._swemu = swemu;
  }

  dpad_up = () => {
    if (this._player.started) return;
    this._controller_mode++;
    this._checkControllerMode();
  }

  dpad_down = () => {
    if (this._player.started) return;
    this._controller_mode--;
    this._checkControllerMode();
  }

  buttons_a = () => {
    this._mp_mode = false;
  }

  buttons_b = () => {
    if (this._player.started) this.init(this._user);
    else this.terminate();
  }

  buttons_y = () => {
    let nc = new NetworkConnection();
    if (this._mp_mode) {
      // Create room
      nc.onrecv((recvObj) => {
        console.log(recvObj);
        if (!recvObj.success) console.warn(recvObj);
        if (recvObj.type === "game.create") this.roomCode = recvObj.data.code;
      });

      nc.onopen(() => {
        nc.send({
          type: "game.create",
          data:{
          },
        });
      });

    } else {
      // Join room
      nc.onrecv((recvObj) => {
        if (!recvObj.success) console.warn(recvObj);
        if (recvObj.type === "game.join" && recvObj.data.msg === "Connected to room.") this.roomCode = recvObj.data.code;
      });

      nc.onopen(() => {
        nc.send({
          type: "game.join",
          data: {
            code: "ABCD",
          }
        });
      });
    }
  }

  buttons_x = () => {
    let nc = new NetworkConnection();

    console.log(this._mp_mode);

    nc.onrecv((recvObj) => {
      this._player.started = true;

      if (!recvObj.success) console.warn(recvObj);
      if (recvObj.type === "game.play") {
        if (recvObj.data.player === "left") this._player.y.left = recvObj.data.y;
        else this._player.y.right = recvObj.data.y;
        console.log([recvObj.data.joyR, recvObj.data.joyL]);
        if (this._mp_mode) {
          this._joyR = recvObj.data.joyR;
        } else {
          this._joyL = recvObj.data.joyL;
          this._ball = recvObj.data.ball;
          this._ball.point = new Point(this._ball.point.x, this._ball.point.y);
          this._ball.move = new Vector2D(this._ball.move.x, this._ball.move.y);
        }

        nc.send({
          type: "game.play",
          data:{
            code: this.roomCode,
            player: this._mp_mode ? "left" : "right",
            y: this._mp_mode ? this._player.y.left : this._player.y.right,
            ball: this._ball,
            joy: this._mp_mode ? this._joyL : this._joyR,
          },
        });
      }
    });

    nc.onopen(() => {
      nc.send({
        type: "game.play",
        data:{
          code: this.roomCode,
          player: this._mp_mode ? "left" : "right",
          y: this._mp_mode ? this._player.y.left : this._player.y.right,
          ball: this._ball,
          joy: this._mp_mode ? this._joyL : this._joyR,
        },
      });
    });
  }

  buttons_pause = () => {
  }

  _checkControllerMode = () => {
    if (this._controller_mode < 0) this._controller_mode = 0;
    else if (this._controller_mode > 1) this._controller_mode = 1;
  }

  _updateBall = (draw, gamepads, render, ux, uy) => {
    if (ux === undefined || ux === null) ux = true;
    if (uy === undefined || uy === null) uy = true;

    // this._ball.point.add(this._ball.move.multiply_NW(render.deltaTime * 100 * this._ball.speed));
    let mm = this._ball.move.multiply_NW(render.deltaTime * 100 * this._ball.speed);
    if (ux) this._ball.point.x += mm.x;
    if (uy) this._ball.point.y += mm.y;

    let cm = this._controller_mode;
    let mp = this._mp_mode;

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
    this._controller_mode = cm;
    this._mp_mode = mp;
    this._player.score.left = sl;
    this._player.score.right = sr;
    this._player.y.left = yl;
    this._player.y.right = yr;
  }

  _renderBall = (draw, gamepads, render) => {
    draw.setColor("ffffff");
    draw.arc(this._ball.point, 6);
  }

  _updatePlayers = (draw, gamepads, render) => {
    /*
    this._player.y.left += gamepads.player1.joystick.left.y * render.deltaTime * 100 * this._player.speed;
    if (this._player.y.left < 0) this._player.y.left = 0;
    else if (this._player.y.left > this._swemu.screen.height - this._player.model.y) this._player.y.left = this._swemu.screen.height - this._player.model.y;

    // One Controller: player1.right.y OR Two Controller: player2.left.y
    let rdata = this._controller_mode === 0 ? gamepads.player1.joystick.right.y : gamepads.player2.joystick.left.y;
    this._player.y.right += rdata * render.deltaTime * 100 * this._player.speed;
    if (this._player.y.right < 0) this._player.y.right = 0;
    else if (this._player.y.right > this._swemu.screen.height - this._player.model.y) this._player.y.right = this._swemu.screen.height - this._player.model.y;
    */
    if (this._mp_mode) {
      this._player.y.left += gamepads.player1.joystick.left.y * render.deltaTime * 100 * this._player.speed;
      if (this._player.y.left < 0) this._player.y.left = 0;
      else if (this._player.y.left > this._swemu.screen.height - this._player.model.y) this._player.y.left = this._swemu.screen.height - this._player.model.y;
    } else {
      this._player.y.right += gamepads.player1.joystick.left.y * render.deltaTime * 100 * this._player.speed;
      if (this._player.y.right < 0) this._player.y.right = 0;
      else if (this._player.y.right > this._swemu.screen.height - this._player.model.y) this._player.y.right = this._swemu.screen.height - this._player.model.y;
    }
  }

  _renderPlayers = (draw, gamepads, render) => {
    draw.setColor("ffffff");

    let leftPlayer = new Point(this._player.xOffset, this._player.y.left);
    draw.rect(leftPlayer, this._player.model.add_NW(leftPlayer));

    let rightPlayer = new Point(this._swemu.screen.width - (this._player.xOffset + this._player.model.x), this._player.y.right);
    draw.rect(rightPlayer, this._player.model.add_NW(rightPlayer));
  }

  _renderScore = (draw, gamepads, render) => {
    draw.setColor("ffffff");
    let mid = new Point(this._swemu.screen.width / 2, 10);
    let sl = ""+this._player.score.left;
    let sr = ""+this._player.score.right;
    draw.text(sl, new Point(sl.length * 14, 14).add(mid), 14);
    draw.text(sr, new Point(-14, 14).add(mid), 14);
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
        // One Controller: player1.joystick.right.y OR Two Controller: player2.joystick.left.y
        // let rdata = this._controller_mode === 0 ? gamepads.player1.joystick.right.y : gamepads.player2.joystick.left.y;
        // if (!this._mp_mode) this._ball.move.y += gamepads.player1.joystick.y * 0.5;
        this._ball.move.y += this._joyR * 0.5;
        this._updateBall(draw, gamepads, render, true, false);
      }
    }

    // Check left player
    if (this._ball.point.x - this._ball.radius <= this._player.xOffset + this._player.model.x && this._ball.point.x + this._ball.radius >= this._player.xOffset) {
      if (this._ball.point.y + this._ball.radius >= this._player.y.left && this._ball.point.y - this._ball.radius <= this._player.y.left + this._player.model.y) {
        this._ball.point.x = this._player.xOffset + this._player.model.x;
        this._ball.move.x *= -1;
        if (this._mp_mode) this._ball.move.y += gamepads.player1.joystick.left.y * 0.5;
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
    this._joyL = 0;
    this._joyR = 0;

    this._terminated = false;
    this._user = user;
    this._controller_mode = 0;
    this._mp_mode = true;
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

    if (this._mp_mode) this._joyL = gamepads.player1.joystick.y;
    else this._joyR = gamepads.player1.joystick.y;

    if (!this._player.started) {
      draw.setColor("ffffff");
      draw.text((this._controller_mode === 0 ? "1" : "2") + " Controller", new Point(this._swemu.screen.width / 2, this._swemu.screen.height - 14), 14, null, null, true);

      if (this._controller_mode === 1 && gamepads.player2.id === -1) {
        draw.setColor("ffffff");
        draw.text("Controller 2 not connected", new Point(this._swemu.screen.width / 2, this._swemu.screen.height - 14 - 14 - 14), 14, null, null, true);
      }
    }

    // if (gamepads.player1.joystick.used.left && (this._controller_mode === 0 || gamepads.player2.id !== -1)) this._player.started = true;

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
