import { MyMath } from "../MyMath.js";
import { Point, Vector2D } from "../Geometry.js";
import { setCookie, getCookie } from "../Cookies.js";

export class HomeScreen {
  constructor(swemu) {
    this._swemu = swemu;
    this._internals = {};
  }

  init = (internals) => {
    this._paused = false;
    this._internals = internals;
    this._appCount = Object.entries(this._internals.applications.external).length;
    this._appIconSize = this._swemu.screen.height * 0.4;
    this._appIconOffset = this._swemu.screen.height * 0.3; // Used twice = 0.4 (+0.6 = 1)
    this._appScrollOffset = 0;
    this._highlightedApp = 0;
    this._gamepad_swiped = false;
  }

  terminate = () => {
  }

  // TODO: Maybe add gamepads.output "listener" (=> index fires this function (each time a value changes?))

  render = (draw, gamepads, render) => {
    if (this._currentGame === null) this._paused = false;
    if (this._paused) {
      if (this._currentGame._terminated) this._currentGame = null;
      return;
    }

    let gpOx = gamepads.output.axes[0];
    let gpOxTresh = 0.8;
    if (MyMath.abs(gpOx) < gpOxTresh / 2) this._gamepad_swiped = false; // Make swipe available again after being below a certain threshold
    if (!this._gamepad_swiped) {
      if (gpOx >= gpOxTresh) {
        this._highlightedApp++;
        this._gamepad_swiped = true;
      } else if (gpOx <= -gpOxTresh) {
        this._highlightedApp--;
        this._gamepad_swiped = true;
      }
      if (this._highlightedApp > this._appCount - 1) this._highlightedApp = this._appCount - 1;
      else if (this._highlightedApp < 0) this._highlightedApp = 0;
    }

    let i = 0;
    Object.entries(this._internals.applications.external).forEach((gameName, gameClass) => {
      // Multi colors for testing
      //let unselectedColors = ["875a5a", "87875a", "5a8787", "5a5a87", "764976", "767687"];
      //let selectedColors = ["d7aaaa", "d7d7aa", "aad7d7", "aaaad7", "c699c6", "c6c6d7"];
      let unselectedColors = ["87875a", "5a8787", "5a8787", "87875a", "5a8787", "87875a"];
      let selectedColors = ["d7d7aa", "aad7d7", "aad7d7", "d7d7aa", "aad7d7", "d7d7aa"];

      let appCountOffset = (i - this._appScrollOffset) * (this._appIconSize + 25);

      let app1start = new Point(50+appCountOffset, this._appIconOffset);
      let app1end = new Point(50+appCountOffset+this._appIconSize, this._appIconOffset+this._appIconSize);
      let app1text = new Point(app1start.x, app1end.y);

      if (i === this._highlightedApp) {
        draw.dynamic.setColor(selectedColors[i]);
        draw.dynamic.rect(app1start, app1end);
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text((""+gameName).search("coinCollect") >= 0 ? "CoinCollect" : "PhysicTest", new Point(0, 18+10).add(app1text), 18);
        if (app1end.x >= this._swemu.screen.width) {
          this._appScrollOffset++;
        } else if (app1start.x <= 0) {
          this._appScrollOffset--;
        }
      } else {
        draw.dynamic.setColor(unselectedColors[i]);
        draw.dynamic.rect(app1start, app1end);
        draw.dynamic.setColor("a9a9a9");
        draw.dynamic.text((""+gameName).search("coinCollect") >= 0 ? "CoinCollect" : "PhysicTest", new Point(0, 16+10).add(app1text), 16);
      }
      i++;
    });

    if (gamepads.output.buttons.south.pressed) {
      if (!gamepads.actions.south) {
        let game = new (Object.entries(this._internals.applications.external)[this._highlightedApp][1])(this._swemu);
        this._currentGame = game.initGame();
        this._paused = true;
      }
      gamepads.actions.south = true;
    } else gamepads.actions.south = false;
  }
}
