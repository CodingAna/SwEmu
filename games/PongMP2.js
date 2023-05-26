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
    if (this._waitForNet) return;

    this._net.onrecv((resp) => {
      if (resp.type !== "room.create") return;
      this._waitForNet = false;
      if (resp.success) {
        this._room = resp.room;
        this._state = States.LOBBY;
        this._roomHeartbeat();
      } else console.error("Could not create room");
    });

    this._net.send({type: "room.create", gametype: "Pong", user: this._user});
    this._waitForNet = true;
  }

  _roomJoin = () => {
    if (this._waitForNet) return;
    if (this._text.length !== 4) return;

    this._net.onrecv((resp) => {
      if (resp.type !== "room.join") return;
      this._waitForNet = false;
      if (resp.success) {
        this._room = resp.room;
        this._state = States.LOBBY;
        this._roomHeartbeat();
      } else console.error("Could not join room");
    });

    this._net.send({type: "room.join", roomcode: this._text, user: this._user});
    this._waitForNet = true;
  }

  _roomStart = () => {
    if (this._waitForNet) return;
    if (!this._host) return;

    this._net.onrecv((resp) => {
      if (resp.type !== "room.start") return;
      this._waitForNet = false;
      if (resp.success) {
        this._room = resp.room;
        this._game = resp.game;
        this._state = States.INGAME_WAIT;
        this._gameStart();
      } else console.error("Could not start room");
    });

    this._net.send({type: "room.start", gametype: "Pong", roomcode: this._room.roomcode, user: this._user});
    this._waitForNet = true;
  }

  _roomHeartbeat = () => {
    if (!this._host) return;
    if (this._heartBeating) return;

    this._net.onrecv((resp) => {
      if (resp.type !== "room.heartbeat") return;
      if (resp.success) {
        this._room = resp.room;
        this._game = resp.game;
        if (this._game !== null) {
          if (this._game.started) {
            this._heartBeating = false;
            this._state = States.INGAME;
            this._gameData();
          } else this._state = States.INGAME_WAIT;
        } else this._net.send({type: "room.heartbeat", roomcode: this._room.roomcode, user: this._user});
      } else console.warn(resp); // console.error("Could not get room info");
    });

    this._net.send({type: "room.heartbeat", roomcode: this._room.roomcode, user: this._user});
    this._heartBeating = true;
  }

  _gameStart = () => {
    if (this._waitForNet) return;
    if (!this._host) return;

    this._net.onrecv((resp) => {
      if (resp.type !== "game.start") return;
      this._waitForNet = false;
      if (resp.success) {
        this._game = resp.game;
        this._state = States.INGAME;
        this._gameData();
      } else console.error("Could not start game");
    });

    this._net.send({type: "game.start", gamecode: this._room.gamecode, user: this._user});
    this._waitForNet = true;
  }

  _gameData = () => {
    if (!this._host) return;
    if (this._gameBeating) return;

    this._net.onrecv((resp) => {
      if (resp.type !== "game.data") return;
      if (resp.success) {
        this._game = resp.game;
        if (this._host) this.y.other = this._game.right.y;
        else this.y.other = this._game.left.y;
        this._net.send({type: "game.data", gamecode: this._room.gamecode, user: this._user, data: {position: {y: this.y.me, v: this.gpv.me}}});
      } else console.error("Could not get game data");
    });

    this._net.send({type: "game.data", gamecode: this._room.gamecode, user: this._user, data: {position: {y: this.y.me, v: this.gpv.me}}});
    this._gameBeating = true;
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

    this._net = new NetworkConnection();
    this._heartBeating = false;
    this._gameBeating = false;

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
      this.y.me += this.gpv.me * speed * pps;
      this.y.other += this.gpv.other * speed * pps;

      draw.setColor("ffffff");
      draw.rect(new Point(10, this.y.me), new Point(25, this.y.me + 50));
      draw.rect(new Point(this._swemu.screen.width-10-15, this.y.other), new Point(this._swemu.screen.width-10, this.y.other + 50));

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
