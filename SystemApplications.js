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

  dpad_up = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.dpad_up) this._currentGame.dpad_up();
    } else this._actionGoUp();
  }

  dpad_down = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.dpad_down) this._currentGame.dpad_down();
    } else this._actionGoDown();
  }

  dpad_right = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.dpad_right) this._currentGame.dpad_right();
    } else this._actionGoRight();
  }

  dpad_left = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.dpad_left)  this._currentGame.dpad_left();
    } else this._actionGoLeft();
  }

  buttons_y = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_y) this._currentGame.buttons_y();
    } else {
    }
  }

  buttons_a = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_a) this._currentGame.buttons_a();
    } else {
      this._actionOpen = this._currentRow.valueOf();
      this._actionClick++;
    }
  }

  buttons_b = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_b) this._currentGame.buttons_b();
    } else {
      if (this._actionClick > 0) this._actionClick--;
    }
  }

  buttons_x = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_x) this._currentGame.buttons_x();
    } else {
    }
  }

  buttons_pause = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_pause) this._currentGame.buttons_pause();
    } else {
    }
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

    if (this._highlightedSystemApp > this._systemAppCount - 1) this._highlightedSystemApp = this._systemAppCount - 1;
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
    this._systemAppCount = Object.entries(this._internals.applications.system).length - 1; // -1 for HomeScreen
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
      else this._currentGame.render(draw, gamepads, render);
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
        "Pong": "9a7dc8",
      };
      let selectedColors = {
        "CoinCollect": "d7d7aa",
        "PhysicTest": "aad7d7",
        "HighwayRun": "c699c6",
        "Pong": "dabdf8",
      };
      //let unselectedColors = [, "", "5a8787", "87875a", "5a8787", "87875a"];
      //let selectedColors = ["d7d7aa", "aad7d7", "aad7d7", "d7d7aa", "aad7d7", "d7d7aa"];

      let appCountOffset = (i - this._appScrollOffset) * (this._appIconSize + 25);

      let app1start = new Point(50+appCountOffset, this._appIconOffset-10);
      let app1end = new Point(50+appCountOffset+this._appIconSize, this._appIconOffset+this._appIconSize-10);
      let app1text = new Point(app1start.x, app1end.y);

      if (this._currentRow === 1 && i === this._highlightedApp) {
        draw.dynamic.setColor(selectedColors[gameClass.NAME]);
        draw.dynamic.roundedRect(new Point(-5, -5).add(app1start), new Point(5, 5).add(app1end), 0.25);
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text(gameClass.NAME, new Point(-6, 18+12).add(app1text), 18);
        if (app1end.x >= this._swemu.screen.width) {
          this._appScrollOffset++;
        } else if (app1start.x <= 0) {
          this._appScrollOffset--;
        }
      } else {
        draw.dynamic.setColor(unselectedColors[gameClass.NAME]);
        draw.dynamic.roundedRect(new Point(5, 5).add(app1start), new Point(-5, -5).add(app1end), 0.25);
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
          "News": "BB1900",
          "Store": "BE6C00",
          "Gallery": "0061AF",
          "Controller": "9F9F9F",
          "Settings": "9F9F9F",
        };
        let selectedColors = {
          "News": "FB593A",
          "Store": "FEAC0A",
          "Gallery": "17A1FF",
          "Controller": "DFDFDF",
          "Settings": "DFDFDF",
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

    // Use switch instead
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
      this._currentGame = systemApp.init(this._internals);
      this._paused = true;
      this._actionClick = 0;
    }
    if (this._actionClick === 0) this._actionOpen = -1;
  }
}

export class Settings {
  static get NAME() {return "Settings";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  dpad_up = () => {
    if (this._showUserCreation) {
      if (this._position < this._nameSelection.length) this._nameSelection[this._position]++;
      else if (this._position === this._nameSelection.length) this._backgroundColorSelection++;
    }
    else {
      if (this._inSidebar) {
        this._sidebarSelection--;
        this._vertical = 0;
      } else this._vertical--;

      this._horizontal = 0;

      this._checkSelection();
    }
  }

  dpad_down = () => {
    if (this._showUserCreation) {
      if (this._position < this._nameSelection.length) this._nameSelection[this._position]--;
      else if (this._position === this._nameSelection.length) this._backgroundColorSelection--;
    } else {
      if (this._inSidebar) {
        this._sidebarSelection++;
        this._vertical = 0;
      } else this._vertical++;

      this._horizontal = 0;

      this._checkSelection();
    }
  }

  dpad_right = () => {
    if (this._showUserCreation) {
      this._position++;
    } else {
      if (this._inSidebar) this._inSidebar = false;
      else this._horizontal++;

      this._checkSelection();
    }
  }

  dpad_left = () => {
    if (this._showUserCreation) {
      this._position--;
    } else {
      if (!this._inSidebar) this._horizontal--;

      this._checkSelection();
    }
  }

  buttons_a = () => {
    if (this._showUserCreation) {
      if (this._choseName && this._validName && this._position === 9) {
        let name = "";
        for (let i=0; i<this._nameSelection.length; i++)
          if (this._nameSelection[i] !== 0) name += String.fromCharCode((i === 0 ? 65 : 97) + this._nameSelection[i]-1);
        this._internals.users.push({uid: this._generateUID(), name: name, icon: {background: this._backgroundColorSelection}});
        setCookie("users", JSON.stringify(this._internals.users), 30);

        let ss = this._sidebarSelection;
        let sh = this._horizontal;
        let sv = this._vertical;

        this.terminate();
        if (!this._firstUser) {
          this.init(this._internals); // "Re-init the app"

          this._inSidebar = false;
          this._horizontal = sh;
          this._vertical = sv;
          this._sidebarSelection = ss;
        }
      }
    } else {
      if (this._inSidebar) this._inSidebar = false;
      else {
        if (this._sidebarSelection === 0 && this._vertical === 1 && this._horizontal === this._internals.users.length) this._showUserCreation = true;

        if (this._sidebarSelection === 2 && this._vertical === 1) {
          this._internals.settings.debug = !this._internals.settings.debug;
          setCookie("settings", JSON.stringify(this._internals.settings), 30);
        }
        // && this._horizontal === 0 (standard tho, but add this if there are two horizontal buttons in v=2)
        if (this._sidebarSelection === 2 && this._vertical === 2 && !this._pressedToReset) {
          this._internals.users = [];
          this._internals.settings = {debug: false};
          setCookie("users", JSON.stringify(this._internals.users), 30);
          setCookie("settings", JSON.stringify(this._internals.settings), 30);
          this._pressedToReset = true;
        }
      }
    }
  }

  buttons_b = () => {
    this._firstUser = this._internals.users.length === 0;
    if (!this._firstUser) {
      if (this._showUserCreation) this._showUserCreation = false;
      else {
        if (this._inSidebar) this.terminate();
        else this._inSidebar = true;
      }
    }
  }

  _checkSelection = () => {
    if (this._sidebarSelection < 0) this._sidebarSelection = 0;
    else if (this._sidebarSelection >= this._sidebarElements.length) this._sidebarSelection = this._sidebarElements.length - 1;

    if (this._vertical < 0) this._vertical = 0;
    else {
      if (this._sidebarSelection === 0) {if (this._vertical > 1) this._vertical = 1;}
      else if (this._sidebarSelection === 1) {if (this._vertical > 1) this._vertical = 1;}
      else if (this._sidebarSelection === 2) {if (this._vertical > 2) this._vertical = 2;}
    }

    if (this._horizontal < 0) {
      this._inSidebar = true;
      this._horizontal = 0;
    } else {
      if (this._sidebarSelection === 0) {
        if (this._vertical === 0 && this._horizontal > this._appCount - 1) this._horizontal = this._appCount - 1;
        if (this._vertical === 1 && this._horizontal > this._userCount - (this._reachedUserLimit ? 1 : 0)) this._horizontal = this._userCount - (this._reachedUserLimit ? 1 : 0); // Only -1 if reached userlimit (=>disable hover over hidden dummy)
      }
      else if (this._sidebarSelection === 1) {if (this._horizontal > 0) this._horizontal = 0;}
      else if (this._sidebarSelection === 2) {if (this._horizontal > 0) this._horizontal = 0;}
    }
  }

  _generateUID = () => {
    let uid = "";
    for (let i=1; i<=8+4+4+4+12; i++) {
      uid += parseInt(Math.random() * 16).toString(16);
      if (i === 8 || i === 8+4 || i === 8+4+4 || i === 8+4+4+4) uid += "-";
    }
    return uid;
  }

  init = (internals) => {
    this._terminated = false;
    this._paused = false;
    this._internals = internals;
    // All for user creation, split this up, maybe
    this._position = 0;
    this._nameSelection = [0, 0, 0, 0, 0, 0, 0, 0];
    this._backgroundColorSelection = 0;
    this._firstUser = this._internals.users.length === 0;
    this._reachedUserLimit = this._internals.users.length >= 5;
    this._pressedToReset = false;
    this._resetTimeout = false;
    this._choseName = false;
    this._validName = false;

    this._userCount = this._internals.users.length;
    this._appCount = Object.entries(this._internals.applications.external).length;
    this._appScrollOffset = 0;
    // Now this
    this._sidebarSelection = 0;
    this._sidebarElements = ["General", "Online", "Debug"];
    this._inSidebar = true;
    this._vertical = 0;
    this._horizontal = 0;
    this._showUserCreation = this._firstUser;

    return this;
  }

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
    if (this._terminated) return;

    if (this._showUserCreation) {
      this._choseName = true;
      for (let i=0; i<this._nameSelection.length; i++) {
        // Name has to start at letter position 0
        if (this._nameSelection[i] === 0) this._choseName = false;
        else break;
      }

      if (this._position < 0) this._position = 0;
      else if (this._position >= this._nameSelection.length + 1) this._position = this._nameSelection.length + 1;

      if (this._nameSelection[this._position] < 0) this._nameSelection[this._position] = 26;
      else if (this._nameSelection[this._position] > 26) this._nameSelection[this._position] = 0;

      if (this._backgroundColorSelection < 0) this._backgroundColorSelection = 2;
      else if (this._backgroundColorSelection > 2) this._backgroundColorSelection = 0;

      draw.dynamic.setColor("ffffff");
      draw.dynamic.text("Create " + (this._firstUser ? "the first" : "another") + " user for your Switch. Use the D-pad control to navigate.", new Point(16, 28));
      if (!this._firstUser) draw.dynamic.text("Note: You can only add up to 5 users.", new Point(16, 52));

      // User preview (name + icon) & Check name
      let selectedColors = ["aad7d7", "20b2aa", "f08080"];
      let preRadius = 20;
      let preMid = new Point(this._swemu.screen.width / 2, this._swemu.screen.height - (this._swemu.screen.height / 3) + preRadius);
      let name = "";
      for (let i=0; i<this._nameSelection.length; i++)
        if (this._nameSelection[i] === 0) name += " ";
        else name += String.fromCharCode((i === 0 ? 65 : 97) + this._nameSelection[i]-1);
      name = name.trim();

      let v = true;
      for (let i=0; i<this._internals.users.length; i++) {
        if (this._internals.users[i].name === name) {
          v = false;
          break;
        }
      }
      this._validName = v;

      // Render "user creation tool"
      if (!this._reachedUserLimit) {
        for (let i=0; i<this._nameSelection.length + 1; i++) {
          let relSelP = new Point(150 + i*(25 + 10), 150);
          draw.dynamic.setColor("ffffff");
          if (i === 0 || i === 8) draw.dynamic.text(i === 0 ? "Name" : "Color", new Point(-4, -30).add(relSelP));
          if (i === this._position) draw.dynamic.rect(new Point(-4, -18).add(relSelP), new Point(16, 6).add(relSelP), false);
          if (i < this._nameSelection.length) {
            draw.dynamic.text(this._nameSelection[i] === 0 ? " " : String.fromCharCode((i === 0 ? 65 : 97) + this._nameSelection[i]-1), new Point(0, 0).add(relSelP));
            draw.dynamic.line(new Point(-4, 16).add(relSelP), new Point(16, 16).add(relSelP));
          }
          else draw.dynamic.text(this._backgroundColorSelection, relSelP);
        }
        let i = 9;
        let relSelP = new Point(150 + i*(25 + 10), 150);
        if (i === this._position) draw.dynamic.setColor(this._reachedUserLimit || !this._choseName || !this._validName ? "ac143c" : "40ae40"); // DC143C
        else draw.dynamic.setColor(this._reachedUserLimit || !this._choseName || !this._validName ? "7c040c" : "107e10");
        draw.dynamic.roundedRect(new Point(-4, -16).add(relSelP), new Point(16, 4).add(relSelP));

        // Render preview
        draw.dynamic.setColor(selectedColors[this._backgroundColorSelection]);
        draw.dynamic.arc(preMid, preRadius);
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text("User preview", new Point(-preRadius*2-(("User preview".length+1)*7)-14, 7).add(preMid), 14);
        draw.dynamic.text(name, new Point(-4, 14+preRadius+4).add(preMid), 14, null, null, true);
      }

    } else {
      let sidebarWidth = this._inSidebar ? 160 : 120;

      draw.dynamic.setColor(this._inSidebar ? "2a2a2a" : "242424");
      draw.dynamic.rect(new Point(), new Point(sidebarWidth, this._swemu.screen.height), 0.25);

      for (let i=0; i<this._sidebarElements.length; i++) {
        let h = 50;
        let o = 25;

        if (this._inSidebar) draw.dynamic.setColor(this._sidebarSelection === i ? "4a4a4a" : "3a3a3a");
        else draw.dynamic.setColor(this._sidebarSelection === i ? "424242" : "323232");
        draw.dynamic.rect(new Point(0, o + (o + h) * i), new Point(sidebarWidth, (o + h) * (i + 1)));

        if (this._inSidebar) draw.dynamic.setColor(this._sidebarSelection === i ? "ffffff" : "bbbbbb");
        else draw.dynamic.setColor(this._sidebarSelection === i ? "f8f8f8" : "b1b1b1");
        draw.dynamic.text(this._sidebarElements[i], new Point(15, 32 + o + (o + h) * i), 14)
      }

      let offset = sidebarWidth + 15;
      let tSel = false;
      let height = 0;
      let pHeight = 0;

      if (this._sidebarSelection === 0) {
        tSel = !this._inSidebar && this._vertical === 0;

        height += 15 + 14;
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("Installed apps", new Point(offset, height), 14);
        pHeight = height + 14;

        // (60 for icon) + (2*12 for text) + (10 to bottom)
        height += 14 + 60 + 24 + 20;
        let width = (5 + 60 + 15) * this._appCount;
        if (offset + width > this._swemu.screen.width - offset) width = this._swemu.screen.width - offset - 10;
        draw.dynamic.setColor(tSel ? "2a2a2a" : "242424");
        draw.dynamic.roundedRect(new Point(offset, pHeight), new Point(offset + width, height), 0.25);

        let appList = Object.entries(this._internals.applications.external);
        for (let i=this._appScrollOffset; i<appList.length; i++) {
          let [appName, appClass] = appList[i];

          let unselectedColors = {
            "CoinCollect": "87875a",
            "PhysicTest": "5a8787",
            "HighwayRun": "764976",
            "Pong": "9a7dc8",
          };
          let selectedColors = {
            "CoinCollect": "d7d7aa",
            "PhysicTest": "aad7d7",
            "HighwayRun": "c699c6",
            "Pong": "dabdf8",
          };

          let left = new Point(offset + 15 + (60 + 15) * (i - this._appScrollOffset), pHeight + 15);
          let right = new Point(offset + (15 + 60) * (i - this._appScrollOffset + 1), pHeight + 15 + 60);

          //if (tSel && this._horizontal === i && left.x < offset + 15) this._appScrollOffset--;

          if (tSel && this._appScrollOffset === i && this._horizontal < i) this._appScrollOffset--;

          if (left.x >= width + offset - 15) {
            break;
          }
          if (right.x > width + offset - 15) {
            if (tSel && this._horizontal === i) this._appScrollOffset++;
            else right.x = width + offset;
          }

          draw.dynamic.setColor(tSel && this._horizontal === i ? selectedColors[appClass.NAME] : unselectedColors[appClass.NAME]);
          draw.dynamic.roundedRect(left, right, 0.25);

          if (this._vertical === 0 && this._horizontal === i) {
            draw.dynamic.setColor(tSel ? "ffffff": "dadada");
            draw.dynamic.text(appClass.NAME, new Point(-4, 60 + 24 - 5).add(left));
          }
        }
        pHeight = height;


        tSel = !this._inSidebar && this._vertical === 1;

        height += 15 + 14;
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("Local users", new Point(offset, height), 14);
        pHeight = height + 14;

        // (40 for icon) + (2*12 for text) + (10 to bottom)
        height += 14 + 40 + 24 + 20;
        width = (8 + 40 + 15) * (this._userCount + 1);
        if (offset + width > this._swemu.screen.width - offset) width = this._swemu.screen.width - offset - 10;
        draw.dynamic.setColor(tSel ? "2a2a2a" : "242424");
        draw.dynamic.roundedRect(new Point(offset, pHeight), new Point(offset + width, height), 0.25);

        // "First" user => "Add user"; But apply this to the user list + use this._horizontal to maybe add a light background (rounded)rect
        for (let i=0; i<this._internals.users.length + 1; i++) {
          if (i === this._internals.users.length && this._reachedUserLimit) continue;

          let crossCenter = new Point(offset + 20 + 15 + (15 + 40) * i, pHeight + 35);

          if (this._vertical === 1 && this._horizontal === i) {
            draw.dynamic.setColor("3a3a3a");
            draw.dynamic.roundedRect(new Point(-25-4, -25-4).add(crossCenter), new Point(25+4, 37+4+2).add(crossCenter), 0.25);
          }

          let user = null;
          if (i < this._internals.users.length) user = this._internals.users[i];
          let unselectedColors = ["5a8787", "00827a", "c05050"];
          let selectedColors = ["aad7d7", "20b2aa", "f08080"];

          if (i === this._internals.users.length) draw.dynamic.setColor(tSel ? "4a4a4a" : "3a3a3a");
          else draw.dynamic.setColor(tSel ? selectedColors[user.icon.background] : unselectedColors[user.icon.background]);
          draw.dynamic.arc(crossCenter, 20);

          draw.dynamic.setColor(tSel && this._horizontal === i ? "ffffff" : "dadada");
          let name = i === this._internals.users.length ? "Add" : user.name;
          draw.dynamic.text(name, new Point(-4, 12+20+4).add(crossCenter), tSel && this._horizontal === i ? 12 : 10, null, null, true);

          if (i === this._internals.users.length) {
            draw.dynamic.line(new Point(-10, 0).add(crossCenter), new Point(10, 0).add(crossCenter));
            draw.dynamic.line(new Point(0, -10).add(crossCenter), new Point(0, 10).add(crossCenter));
          }
        }

        pHeight = height;


      } else if (this._sidebarSelection === 1) {
        tSel = !this._inSidebar && this._vertical === 0;

        height += 15 + 14;
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("Selected server", new Point(offset, height), 14);
        pHeight = height + 14;

        // (30 for dropdown (to be implemented)) + (10 to bottom)
        height += 14 + 30 + 10;
        draw.dynamic.setColor(tSel ? "2a2a2a" : "242424");
        draw.dynamic.roundedRect(new Point(offset, pHeight), new Point(offset + 140, height), 0.25);
        // 140 ~ 13 chars ?
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("DE-Essen-1", new Point(offset + 10, pHeight + 14 + 12), 14);
        pHeight = height;


        tSel = !this._inSidebar && this._vertical === 1;

        height += 15 + 14;
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("Online account", new Point(offset, height), 14);
        pHeight = height + 14;

        // (30 for dropdown) + (10 to bottom)
        height += 14 + 30 + 10;
        draw.dynamic.setColor(tSel ? "2a2a2a" : "242424");
        draw.dynamic.roundedRect(new Point(offset, pHeight), new Point(offset + 280, height), 0.25);
        // 280 ~ 27 chars ?
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("john.doe@email.com", new Point(offset + 10, pHeight + 14 + 12), 14);
        pHeight = height;


      } else if (this._sidebarSelection === 2) {
        tSel = !this._inSidebar && this._vertical === 0;

        height += 15 + 14;
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("Switch UID", new Point(offset, height), 14);
        pHeight = height + 14;

        // (30 for dropdown (to be implemented)) + (10 to bottom)
        height += 14 + 30 + 10;
        draw.dynamic.setColor(tSel ? "2a2a2a" : "242424");
        draw.dynamic.roundedRect(new Point(offset, pHeight), new Point(offset + 370, height), 0.25);
        // 370 ~ 36 chars
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text(this._internals.uid, new Point(offset + 10, pHeight + 14 + 12), 14);
        pHeight = height;


        tSel = !this._inSidebar && this._vertical === 1;

        height += 15 + 14;
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("Show input delay & FPS", new Point(offset, height), 14);
        pHeight = height + 14;

        // (30 for button) + (10 to bottom)
        height += 14 + 30 + 10;
        draw.dynamic.setColor(tSel ? "2a2a2a" : "242424");
        draw.dynamic.roundedRect(new Point(offset, pHeight), new Point(offset + 170, height), 0.25);
        // 170 ~ 17 chars
        let rstTxtPos = new Point(offset + 10, pHeight + 14 + 12);
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text(this._internals.settings.debug ? "Hide" : "Show", rstTxtPos, 14);
        pHeight = height;


        tSel = !this._inSidebar && this._vertical === 2;

        height += 15 + 14;
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("Factory reset", new Point(offset, height), 14);
        pHeight = height + 14;

        // (30 for button) + (10 to bottom)
        height += 14 + 30 + 10;
        draw.dynamic.setColor(tSel ? "ab2222" : "660202");
        draw.dynamic.roundedRect(new Point(offset, pHeight), new Point(offset + 170, height), 0.25);
        // 170 ~ 17 chars
        rstTxtPos = new Point(offset + 10, pHeight + 14 + 12);
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        if (this._pressedToReset) {
          draw.dynamic.text("Resetting...", rstTxtPos, 14);
          if (!this._resetTimeout) setTimeout(() => {location.reload();}, 750);
          this._resetTimeout = true;
        } else draw.dynamic.text("Reset this Switch", rstTxtPos, 14);
        pHeight = height;
      }
    }
  }
}

export class ControllerManager {
  static get NAME() {return "Controller";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  buttons_b = () => {
    this.terminate();
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
    if (this._terminated) return;

    let center = new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2);
    let text = "Under construction";
    draw.dynamic.setColor("2a2a2a");
    draw.dynamic.roundedRect(new Point(-text.length*8+16+4, -28).add(center), new Point(text.length*8-16, 16).add(center), 0.25);
    draw.dynamic.setColor("ffffff");
    draw.dynamic.text(text, center, 16, null, null, true);
  }
}

export class Gallery {
  static get NAME() {return "Gallery";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  buttons_b = () => {
    this.terminate();
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
    if (this._terminated) return;

    let center = new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2);
    let text = "Under construction";
    draw.dynamic.setColor("2a2a2a");
    draw.dynamic.roundedRect(new Point(-text.length*8+16+4, -28).add(center), new Point(text.length*8-16, 16).add(center), 0.25);
    draw.dynamic.setColor("ffffff");
    draw.dynamic.text(text, center, 16, null, null, true);
  }
}

export class AddOnStore {
  static get NAME() {return "Store";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  buttons_b = () => {
    this.terminate();
  }

  _postRequest = (route, obj, callback) => {
    if (route === undefined || route === null) route = "/";
    if (obj === undefined || obj === null) obj = {};
    if (callback === undefined || callback === null) callback = () => {};

    fetch("http://localhost:12321" + route, {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj)
    }).then((response) => {
      callback(response);
    });
  }

  init = (internals) => {
    this._terminated = false;
    this._paused = false;
    this._internals = internals;

    /*
    // TODO: Add request to download game content.
    //       "Import" loaded game. How? ==> https://stackoverflow.com/questions/21294/dynamically-load-a-javascript-file
    //       Move js content from index to custom OS class and give apps access to class for easier access (i.e. _postRequest in OS, _loadFile to sideload)
    this._postRequest("/store", {}, (resp) => {
      console.log(resp);
    });
    */

    return this;
  }

  terminate = () => {
    this._terminated = true;

    return this;
  }

  render = (draw, gamepads, render) => {
    if (this._terminated) return;

    let center = new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2);
    let text = "Under construction";
    draw.dynamic.setColor("2a2a2a");
    draw.dynamic.roundedRect(new Point(-text.length*8+16+4, -28).add(center), new Point(text.length*8-16, 16).add(center), 0.25);
    draw.dynamic.setColor("ffffff");
    draw.dynamic.text(text, center, 16, null, null, true);
  }
}

export class NewsApp {
  static get NAME() {return "News";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  buttons_b = () => {
    this.terminate();
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
    if (this._terminated) return;

    let center = new Point(this._swemu.screen.width / 2, this._swemu.screen.height / 2);
    let text = "Under construction";
    draw.dynamic.setColor("2a2a2a");
    draw.dynamic.roundedRect(new Point(-text.length*8+16+4, -28).add(center), new Point(text.length*8-16, 16).add(center), 0.25);
    draw.dynamic.setColor("ffffff");
    draw.dynamic.text(text, center, 16, null, null, true);
  }
}
