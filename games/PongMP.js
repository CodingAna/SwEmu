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
        this._state = States.LOBBY;
      } else if (this._selection === 1) {
        this._host = false;
        this._state = States.JOIN;
      } else ;
    } else if (this._state === States.JOIN) {
      if (this._text === "") {
        this._showKeyboard();
      } else {
        this._state = States.LOBBY;
      }
    } else if (this._state === States.LOBBY) {
      if (this._host) this._state = States.INGAME; // Send start game request to server
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

  init = (user) => {
    this._terminated = false;
    this._paused = false;
    this._started = false;
    this._user = user;

    this._state = States.STARTSCREEN;
    this._selection = 0;
    this._text = "";

    this._host = false;
    this._players = [{name: this._user.name}];

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
      for (let i=0; i<this._players.length; i++)
        draw.text(this._players[i].name, new Point(100, 140 + 40 * i), 20);
    } else if (this._state === States.INGAME) {
      draw.setColor("ffffff");
      draw.rect(new Point(10, 0), new Point(25, 50));
      draw.rect(new Point(this._swemu.screen.width-10-15, 0), new Point(this._swemu.screen.width-10, 50));
    } else if (this._state === States.END) {
    }
  }
}

let States = Object.freeze({
  STARTSCREEN: 0,
  JOIN: 1,
  LOBBY: 2,
  INGAME: 3,
  END: 4
});
