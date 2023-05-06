import { MyMath } from "./MyMath.js";
import { Utils } from "./Utils.js";
import { Point, Vector2D } from "./Geometry.js";
import { setCookie, getCookie } from "./Cookies.js";

export class HomeScreen {
  static get NAME() {return "HomeScreen";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  _actionGoUp = () => {
    if (this._actionClick === 0) {
      this._currentRow--;
    }
    this._checkHighlights();
  }

  _actionGoDown = () => {
    if (this._actionClick === 0) {
      this._currentRow++;
    }
    this._checkHighlights();
  }

  _actionGoRight = () => {
    if (this._actionClick === 0) {
      if (this._currentRow === 0) this._highlightedUser++;
      else if (this._currentRow === 1) this._highlightedApp++;
      else if (this._currentRow === 2) this._highlightedSystemApp++;
    }
    if (this._actionOpen === 1) {
      this._appSelectedUser++;
    }

    this._checkHighlights();
  }

  _actionGoLeft = () => {
    if (this._actionClick === 0) {
      if (this._currentRow === 0) this._highlightedUser--;
      else if (this._currentRow === 1) this._highlightedApp--;
      else if (this._currentRow === 2) this._highlightedSystemApp--;
    }
    if (this._actionOpen === 1) {
      this._appSelectedUser--;
    }

    this._checkHighlights();
  }

  _checkHighlights = () => {
    if (this._currentRow > 2) this._currentRow = 2;
    else if (this._currentRow < 0) this._currentRow = 0;

    if (this._highlightedApp > this._appCount - 1) this._highlightedApp = this._appCount - 1;
    else if (this._highlightedApp < 0) this._highlightedApp = 0;

    if (this._highlightedSystemApp > this._systemAppCount) this._highlightedSystemApp = this._systemAppCount - 1;
    else if (this._highlightedSystemApp < 0) this._highlightedSystemApp = 0;

    if (this._highlightedUser > this._internals.users.length - 1) this._highlightedUser = this._internals.users.length - 1;
    else if (this._highlightedUser < 0) this._highlightedUser = 0;

    if (this._appSelectedUser > this._internals.users.length - 1) this._appSelectedUser = this._internals.users.length - 1;
    else if (this._appSelectedUser < 0) this._appSelectedUser = 0;
  }

  init = (internals) => {
    this._terminated = false;
    this._paused = false;
    this._internals = internals;
    this._currentGame = null;
    this._appCount = Object.entries(this._internals.applications.external).length;
    this._systemAppCount = Object.entries(this._internals.applications.system).length;
    this._appIconSize = this._swemu.screen.height * 0.35;
    this._appIconOffset = this._swemu.screen.height * 0.3; // Used twice = 0.4 (+0.6 = 1)
    this._appScrollOffset = 0;
    this._highlightedApp = 0;
    this._highlightedSystemApp = 0;
    this._highlightedUser = 0;
    this._gamepad_swiped_x = false;
    this._gamepad_swiped_y = false;
    this._currentRow = 1;
    this._actionOpen = -1;
    this._actionClick = 0;
    this._appSelectedUser = 0;

    return this;
  }

  terminate = () => {
    if (!this._terminated) location.reload();
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
    if (this._currentGame === null) this._paused = false;
    if (this._paused) {
      if (this._currentGame._terminated) this._currentGame = null;
      return;
    }

    let gpOx = gamepads.output.axes[0];
    let gpOxTresh = 0.6;
    if (MyMath.abs(gpOx) < gpOxTresh / 2) this._gamepad_swiped_x = false; // Make swipe available again after being below a certain threshold
    if (!this._gamepad_swiped_x) {
      if (gpOx >= gpOxTresh) {
        this._actionGoRight();
        this._gamepad_swiped_x = true;
      } else if (gpOx <= -gpOxTresh) {
        this._actionGoLeft();
        this._gamepad_swiped_x = true;
      }
    }

    if (!this._gamepad_swiped_x) {
      let gpOy = gamepads.output.axes[1];
      let gpOyTresh = 0.6;
      if (MyMath.abs(gpOy) < gpOyTresh / 2) this._gamepad_swiped_y = false; // Make swipe available again after being below a certain threshold
      if (!this._gamepad_swiped_y) {
        if (gpOy >= gpOyTresh) {
          this._actionGoDown();
          this._gamepad_swiped_y = true;
        } else if (gpOy <= -gpOyTresh) {
          this._actionGoUp();
          this._gamepad_swiped_y = true;
        }
      }
    }

    if (gamepads.output.buttons.dpad.up.pressed) {
      if (!gamepads.actions.dpad.up)
        this._actionGoUp();
      gamepads.actions.dpad.up = true;
    } else gamepads.actions.dpad.up = false;

    if (gamepads.output.buttons.dpad.down.pressed) {
      if (!gamepads.actions.dpad.down)
        this._actionGoDown();
      gamepads.actions.dpad.down = true;
    } else gamepads.actions.dpad.down = false;

    if (gamepads.output.buttons.dpad.right.pressed) {
      if (!gamepads.actions.dpad.right)
        this._actionGoRight();
      gamepads.actions.dpad.right = true;
    } else gamepads.actions.dpad.right = false;

    if (gamepads.output.buttons.dpad.left.pressed) {
      if (!gamepads.actions.dpad.left)
        this._actionGoLeft();
      gamepads.actions.dpad.left = true;
    } else gamepads.actions.dpad.left = false;

    let date = new Date();
    draw.dynamic.setColor("ffffff")
    draw.dynamic.text(Utils.fillStart(""+date.getHours(), "0", 2) + ":" + Utils.fillStart(""+date.getMinutes(), "0", 2), new Point(this._swemu.screen.width - (30 + 14), 30), 14, null, null, true);

    let i = 0;
    Object.entries(this._internals.applications.external).forEach((g) => {
      let [gameName, gameClass] = g;
      // Multi colors for testing
      //let unselectedColors = ["875a5a", "87875a", "5a8787", "5a5a87", "764976", "767687"];
      //let selectedColors = ["d7aaaa", "d7d7aa", "aad7d7", "aaaad7", "c699c6", "c6c6d7"];
      let unselectedColors = {
        "CoinCollect": "87875a",
        "PhysicTest": "5a8787",
        "HighwayRun": "764976",
      };
      let selectedColors = {
        "CoinCollect": "d7d7aa",
        "PhysicTest": "aad7d7",
        "HighwayRun": "c699c6",
      };
      //let unselectedColors = [, "", "5a8787", "87875a", "5a8787", "87875a"];
      //let selectedColors = ["d7d7aa", "aad7d7", "aad7d7", "d7d7aa", "aad7d7", "d7d7aa"];

      let appCountOffset = (i - this._appScrollOffset) * (this._appIconSize + 25);

      let app1start = new Point(50+appCountOffset, this._appIconOffset-10);
      let app1end = new Point(50+appCountOffset+this._appIconSize, this._appIconOffset+this._appIconSize-10);
      let app1text = new Point(app1start.x, app1end.y);

      if (this._currentRow === 1 && i === this._highlightedApp) {
        draw.dynamic.setColor(selectedColors[gameClass.NAME]);
        draw.dynamic.rect(new Point(-5, -5).add(app1start), new Point(5, 5).add(app1end));
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text(gameClass.NAME, new Point(-6, 18+12).add(app1text), 18);
        if (app1end.x >= this._swemu.screen.width) {
          this._appScrollOffset++;
        } else if (app1start.x <= 0) {
          this._appScrollOffset--;
        }
      } else {
        draw.dynamic.setColor(unselectedColors[gameClass.NAME]);
        draw.dynamic.rect(new Point(5, 5).add(app1start), new Point(-5, -5).add(app1end));
        draw.dynamic.setColor("a9a9a9");
        draw.dynamic.text(gameClass.NAME, new Point(6, 16).add(app1text), 16);
      }
      i++;
    });

    i = 0;
    Object.entries(this._internals.applications.system).forEach((g) => {
      let [gameName, gameClass] = g;
      if (gameClass.NAME !== "HomeScreen") {
        // Multi colors for testing
        //let unselectedColors = ["875a5a", "87875a", "5a8787", "5a5a87", "764976", "767687"];
        //let selectedColors = ["d7aaaa", "d7d7aa", "aad7d7", "aaaad7", "c699c6", "c6c6d7"];
        let unselectedColors = {
          "Settings": "a45410",
        };
        let selectedColors = {
          "Settings": "f4a460",
        };
        //let unselectedColors = [, "", "5a8787", "87875a", "5a8787", "87875a"];
        //let selectedColors = ["d7d7aa", "aad7d7", "aad7d7", "d7d7aa", "aad7d7", "d7d7aa"];

        // TODO: I have to fix this, I'll just let it at 6 system apps for now
        let appCountOffset = (i + 1.5) * (this._appIconSize / 2 + 15);
        let appCenter = new Point(appCountOffset + (this._appIconSize / 5), this._swemu.screen.height - (this._appIconSize / 5 + 30));

        if (this._currentRow === 2 && i === this._highlightedSystemApp) {
          draw.dynamic.setColor(selectedColors[gameClass.NAME]);
          draw.dynamic.arc(appCenter, this._appIconSize/5);
          draw.dynamic.setColor("ffffff");
          draw.dynamic.text(gameClass.NAME, new Point(-4, 16 + (this._appIconSize / 5) + 4).add(appCenter), 16, null, null, true);
        } else {
          draw.dynamic.setColor(unselectedColors[gameClass.NAME]);
          draw.dynamic.arc(appCenter, this._appIconSize/5);
          draw.dynamic.setColor("a9a9a9");
          //draw.dynamic.text(gameClass.NAME, new Point(6, 16).add(app1text), 16);
        }
        i++;
      }
    });

    i = 0;
    this._internals.users.forEach((user) => {
      let unselectedColors = ["5a8787", "00827a", "c05050"];
      let selectedColors = ["aad7d7", "20b2aa", "f08080"];

      let userRadius = 18;
      let userOffset = i * (userRadius * 2 + 6);
      let userCenter = new Point(36+userOffset, 36);

      if (this._currentRow === 0 && i === this._highlightedUser) {
        //draw.dynamic.setColor("ffffff");
        //draw.dynamic.arc(userCenter, userRadius+1);
        draw.dynamic.setColor(selectedColors[user.icon.background]);
        draw.dynamic.arc(userCenter, userRadius);
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text(user.name, new Point(-4, 12+userRadius+4).add(userCenter), 12, null, null, true);
      } else {
        draw.dynamic.setColor(unselectedColors[user.icon.background]);
        draw.dynamic.arc(userCenter, userRadius);
      }
      i++;
    });

    if (this._actionOpen === 0) {
      // On user
      this._actionClick = 0;

    } else if (this._actionOpen === 1) {
      // On app (external)
      if (this._actionClick === 1) {
        draw.dynamic.setColor("2a2a2a");
        draw.dynamic.rect(new Point(0, this._swemu.screen.height / 2), new Point(this._swemu.screen.width, this._swemu.screen.height));

        i = 0;
        this._internals.users.forEach((user) => {
          let unselectedColors = ["5a8787", "00827a", "c05050"];
          let selectedColors = ["aad7d7", "20b2aa", "f08080"];

          let userWidth = this._swemu.screen.height / 4;
          let userOffset = userWidth + (i * (userWidth + 12));
          let userCenter = new Point(userOffset, this._swemu.screen.height - userWidth);

          if (i === this._appSelectedUser) {
            draw.dynamic.setColor(selectedColors[user.icon.background]);
            draw.dynamic.rect(new Point(-userWidth/2-2, -userWidth/2-2).add(userCenter), new Point(userWidth/2+2, userWidth/2+2).add(userCenter));
            draw.dynamic.setColor("ffffff");
            draw.dynamic.text(user.name, new Point(-4, 12+userWidth/2+10).add(userCenter), 14, null, null, true);
          } else {
            draw.dynamic.setColor(unselectedColors[user.icon.background]);
            draw.dynamic.rect(new Point(-userWidth/2+2, -userWidth/2+2).add(userCenter), new Point(userWidth/2-2, userWidth/2-2).add(userCenter));
          }
          i++;
        });
      } else if (this._actionClick === 2) {
        let game = new (Object.entries(this._internals.applications.external)[this._highlightedApp][1])(this._swemu);
        this._currentGame = game.init(this._internals.users[this._appSelectedUser]);
        this._paused = true;
        this._actionClick = 0;
      } else this._actionClick = 0;

    } else if (this._actionOpen === 2) {
      // On app (system)
      let systemApp = new (Object.entries(this._internals.applications.system)[this._highlightedSystemApp][1])(this._swemu);
      this._currentGame = systemApp.init();
      this._paused = true;
      this._actionClick = 0;
    }
    if (this._actionClick === 0) this._actionOpen = -1;

    if (gamepads.output.buttons.south.pressed) {
      if (!gamepads.actions.south) {
        this._actionOpen = this._currentRow.valueOf();
        this._actionClick++;
      }
      gamepads.actions.south = true;
    } else gamepads.actions.south = false;
  }
}

export class Settings {
  static get NAME() {return "Settings";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  init = (internals) => {
    this._terminated = false;
    this._paused = false;
    this._internals = internals;

    return this;
  }

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
  }
}
