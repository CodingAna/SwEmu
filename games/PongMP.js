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
    if (this._terminated) return;
    if (this._started) return;

    if ()
  }

  buttons_b = () => {
    if (this._started) this.init(this._user);
    else this.terminate();
  }

  buttons_y = () => {
    this._me_p1 = !this._me_p1;
  }

  buttons_x = () => {
    let nc = new NetworkConnection();

    nc.onrecv((recv) => {
      if (recv.type === "game.start") {
        this._gamecode = recv.room.gamecode;
      }
    });

    nc.onopen(() => {
      if (this._me_p1) nc.send({type: "room.create", game: "Pong", user: {uid: this._user.uid, name: this._user.name}});
      else nc.send({type: "room.join", code: "ABCD", game: "Pong", user: {uid: this._user.uid, name: this._user.name}});
    });
  }

  buttons_pause = () => {
  }

  init = (user) => {
    this._terminated = false;
    this._paused = false;
    this._started = false;
    this._user = user;

    this._me_p1 = true;
    this._gamecode = "";

    this._model = {
      offset: 15,
      width: 15,
      height: 50
    };
    this._p1 = {
      y: 100,
      move: 0,
      score: 0
    };
    this._p2 = {
      y: 100,
      move: 0,
      score: 0
    };
    this._ball = {
      point: new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2),
      move: new Vector2D(1, 0),
      radius: 10,
      speed: 2,
      maxSpeed: 3
    };

    this.nc = new NetworkConnection();

    this.nc.onrecv((recv) => {
      if (recv.type === "room.create") {}
      else if (recv.type === "room.join") {}
      else if (recv.type === "room.heartbeat") {
        if (this._gamecode === "" && recv.room.gamecode !== "") {
          this._gamecode = recv.room.gamecode;
          nc.send({type: "game.data"});
        } else nc.send({type: "room.heartbeat", code: "ABCD", game: "Pong", user: {uid: this._user.uid, name: this._user.name}, data: {}});
      }
    });

    this.nc.onopen(() => {
      if (this._me_p1) nc.send({type: "room.create", game: "Pong", user: {uid: this._user.uid, name: this._user.name}});
      else nc.send({type: "room.join", code: "ABCD", game: "Pong", user: {uid: this._user.uid, name: this._user.name}});
    });

    return this;
  }

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
    if (this._terminated) return;
    if (this._paused) return;
    if (this._gamecode !== "") this._started = true;
    if (!this._started) return;

    if (gamepads.player1.joystick.used.left) {
      if (this._me_p1) this._p1.move = gamepads.player1.joystick.left.y;
      else this._p2.move = gamepads.player1.joystick.left.y;
    } else {
      if (this._me_p1) this._p1.move = 0;
      else this._p2.move = 0;
    }

    this._p1.y += this._p1.move;
    this._p2.y += this._p2.move;

    if (this._p1.y < 0) this._p1.y = 0;
    else if (this._p1.y > this._swemu.screen.height - this._model.height) this._p1.y = this._swemu.screen.height - this._model.height;

    if (this._p2.y < 0) this._p2.y = 0;
    else if (this._p2.y > this._swemu.screen.height - this._model.height) this._p2.y = this._swemu.screen.height - this._model.height;

    this._ball.point.add(this._ball.move.multiply_NW(this._ball.speed));

    draw.rect(new Point(this._model.offset, this._p1.y), new Point(this._model.offset + this._model.width, this._p1.y + this._model.height));
    draw.rect(new Point(this._swemu.screen.width - this._model.offset - this._model.width, this._p2.y), new Point(this._swemu.screen.width - this._model.offset, this._p2.y + this._model.height));
    draw.arc(this._ball.point, this._ball.radius);
  }
}
