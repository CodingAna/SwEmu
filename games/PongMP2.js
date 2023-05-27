import { MyMath } from "../MyMath.js";
import { NetworkConnection } from "../OS.js";
import { Utils } from "../Utils.js";
import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

// Concept:
/*
  First: Create / Join room
  Second: Show lobby screen (player list), host can start game
  Third: In game, in contrast to singleplayer the ball won't get any boost in any direction (for now?)
  Who decides the score? The host? The server?
*/

export class PongMP {
  static get NAME() {return "PongMP";}

  constructor(swemu, showNotification, showKeyboard) {
    this._swemu = swemu;

    this._showNotification = showNotification;
    this._showKeyboard = showKeyboard;
  }

  dpad_up = () => {
    if (this._state === States.STARTSCREEN) {
      this._selection--;
      if (this._selection < 0) this._selection = 0;
    } else ;
  }

  dpad_down = () => {
    if (this._state === States.STARTSCREEN) {
      this._selection++;
      if (this._selection > 1) this._selection = 1;
    } else ;
  }

  buttons_a = () => {
    if (this._state === States.STARTSCREEN) {
      if (this._selection === 0) {
        this._host = true;
        this._roomCreate();
      } else if (this._selection === 1) {
        this._host = false;
        this._state = States.JOIN;
      } else ;

    } else if (this._state === States.JOIN) {
      this._text = "ABCD";
      if (this._text === "") {
        this._showKeyboard();
      } else {
        this._roomJoin();
      }

    } else if (this._state === States.LOBBY) {
      if (this._host) this._roomStart();

    } else if (this._state === States.INGAME_WAIT) {

    } else if (this._state === States.INGAME) {

    } else if (this._state === States.END) {
    }
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

  _roomCreate = () => {
    this._net.send({type: "room.create", gametype: "Pong", user: this._user});
  }

  _roomJoin = () => {
    if (this._text.length !== 4) return;

    this._net.send({type: "room.join", roomcode: this._text, user: this._user});
  }

  _roomStart = () => {
    if (!this._host) return;

    this._net.send({type: "room.start", gametype: "Pong", roomcode: this._room.roomcode, user: this._user});
  }

  _roomHeartbeat = () => {
    this._net.send({type: "room.heartbeat", roomcode: this._room.roomcode, user: this._user});
  }

  _gameStart = () => {
    if (!this._host) return;

    this._net.send({type: "game.start", gamecode: this._room.gamecode, user: this._user});
  }

  _gameData = () => {
    this._net.send({type: "game.data", gamecode: this._room.gamecode, user: this._user, data: {position: {y: this.y.me, v: this.gpv.me}}});
  }

  init = (user) => {
    this._terminated = false;
    this._paused = false;
    this._started = false;
    this._user = user;

    this._state = States.STARTSCREEN;
    this._waitForNet = false;
    this._selection = 0;
    this._text = "";

    this._room = null;
    this._game = null;

    this._host = false;
    this._code = "";
    this._players = [{name: this._user.name}];

    this.gpv = {
      me: 0,
      other: 0
    };
    this.y = {
      me: 0,
      other: 0
    }
    this.ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    }

    this._net = new NetworkConnection();
    this._heartBeating = false;
    this._gameBeating = false;

    this._net.onrecv(resp => {
      if (!resp.success) {
        console.error(resp);
        return;
      }
      switch (resp.type) {
        case "room.create":
          this._room = resp.room;
          this._state = States.LOBBY;
          this._roomHeartbeat();
          break;

        case "room.join":
          this._room = resp.room;
          this._state = States.LOBBY;
          this._roomHeartbeat();
          break;

        case "room.start":
          this._room = resp.room;
          this._game = resp.game;
          this._state = States.INGAME_WAIT;
          this._gameStart();
          break;

        case "room.heartbeat":
          this._room = resp.room;
          this._game = resp.game;
          if (this._game === null || !this._game.started) {
            setTimeout(() => {this._net.send({type: "room.heartbeat", roomcode: this._room.roomcode, user: this._user});}, 500);
            break;
          }
          if (this._game.started) {
            console.log("INGAME");
            this._state = States.INGAME;
            this._gameData();
          } else {
            console.log("INGAME_WAIT");
            this._state = States.INGAME_WAIT;
          }
          break;

        case "game.start":
          this._game = resp.game;
          this._state = States.INGAME;
          this._gameData();
          break;

        case "game.data":
          this._game = resp.game;
          this.ball = this._game.ball;
          if (this._host) {
            this.y.other = this._game.right.y;
          } else {
            this.y.other = this._game.left.y;
            this.ball.x = 630 - this.ball.x;
            this.ball.vx *= -1;
          }
          setTimeout(() => {this._net.send({type: "game.data", gamecode: this._room.gamecode, user: this._user, data: {position: {y: this.y.me, v: this.gpv.me}}});}, 1000);
          break;

        default: break;
      }
    });

    return this;
  }

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render, text) => {
    if (this._terminated) return;
    if (this._paused) return;
    this._text = text;

    this.gpv.me = gamepads.player1.joystick.left.y;
    if (this._game !== null) {
      if (this._host) this.gpv.other = this._game.right.v;
      else this.gpv.other = this._game.left.v;

    }

    if (this._state === States.STARTSCREEN) {
      if (this._selection === 0) draw.setColor("ffffff");
      else draw.setColor("bbbbbb");
      draw.rect(new Point(100, 100), new Point(235, 150), false);
      draw.text("HOST", new Point(115, 140), 30);

      if (this._selection === 1) draw.setColor("ffffff");
      else draw.setColor("bbbbbb");
      draw.rect(new Point(100, 200), new Point(235, 250), false);
      draw.text("JOIN", new Point(115, 240), 30);

    } else if (this._state === States.JOIN) {
      draw.setColor("bbbbbb");
      draw.text("Enter room code", new Point(100, 100), 20);

      draw.setColor("ffffff");
      draw.line(new Point(100, 200), new Point(200, 200));
      draw.text(text, new Point(110, 190), 20);

    } else if (this._state === States.LOBBY) {
      draw.setColor("ffffff");
      draw.text("Players:", new Point(100, 100), 20);
      for (let i=0; i<this._room.players.length; i++)
        draw.text(this._room.players[i].name, new Point(100, 140 + 40 * i), 20);

      if (this._host) {
        draw.setColor("ffffff");
        draw.text("Press A to start game", new Point(300, 100), 16)
      }

    } else if (this._state === States.INGAME_WAIT) {
      draw.setColor("ffffff");
      draw.text("INGAME_WAIT", new Point(100, 100), 16);

    } else if (this._state === States.INGAME) {
      let pps = 100;
      let speed = 1;
      this.y.me += this.gpv.me * speed * 1.2 * pps * (1/60);
      this.y.other += this.gpv.other * speed * 1.2 * pps * (1/60);

      if (this.y.me < 0) this.y.me = 0;
      else if (this.y.me > 360-50) this.y.me = 360-50;

      if (this.y.other < 0) this.y.other = 0;
      else if (this.y.other > 360-50) this.y.other = 360-50;

      this.ball.x += this.ball.speed * this.ball.vx * pps * render.deltaTime;
      this.ball.y += this.ball.speed * this.ball.vy * pps * render.deltaTime;

      if (this.ball.x < 0) {
        this.ball.x = 0;
        this.ball.vx *= -1;
      } else if (this.ball.x > 630) {
        this.ball.x = 630;
        this.ball.vx *= -1;
      }

      if (this.ball.y < 0) {
        this.ball.y *= -1;
        this.ball.vy *= -1;
      } else if (this.ball.y > 360) {
        this.ball.y = 360;
        this.ball.vy *= -1;
      }

      draw.setColor("ffffff");
      draw.rect(new Point(10, this.y.me), new Point(25, this.y.me + 50));
      draw.rect(new Point(this._swemu.screen.width-10-15, this.y.other), new Point(this._swemu.screen.width-10, this.y.other + 50));

      draw.arc(new Point(this.ball.x, this.ball.y), 10);

    } else if (this._state === States.END) {
    }
  }
}

let States = Object.freeze({
  STARTSCREEN: 0,
  JOIN: 1,
  LOBBY: 2,
  INGAME_WAIT: 3,
  INGAME: 4,
  END: 5,
});
