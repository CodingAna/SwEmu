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

  buttons_north = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_north) this._currentGame.buttons_north();
    } else {
    }
  }

  buttons_south = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_south) this._currentGame.buttons_south();
    } else {
      this._actionOpen = this._currentRow.valueOf();
      this._actionClick++;
    }
  }

  buttons_east = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_east) this._currentGame.buttons_east();
    } else {
      if (this._actionClick > 0) this._actionClick--;
    }
  }

  buttons_west = () => {
    if (this._paused && this._currentGame !== null && !this._currentGame._terminated) {
      if (this._currentGame.buttons_west) this._currentGame.buttons_west();
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
          "NewsApp": "a45410",
          "AddOnStore": "a45410",
          "Gallery": "a45410",
          "ControllerManager": "a45410",
          "Settings": "a45410",
        };
        let selectedColors = {
          "NewsApp": "f4a460",
          "AddOnStore": "f4a460",
          "Gallery": "f4a460",
          "ControllerManager": "f4a460",
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
        this._horizontal = 0;
      } else this._vertical--;

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
        this._horizontal = 0;
      } else this._vertical++;

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

  buttons_south = () => {
    if (this._showUserCreation) {
      if (this._reachedUserLimit) {
        if (!this._pressedToReset) {
          this._internals.users = [];
          setCookie("users", JSON.stringify(this._internals.users));
          this._pressedToReset = true;
        }
      } else {
        if (this._choseName && this._validName && this._position === 9) {
          let name = "";
          for (let i=0; i<this._nameSelection.length; i++)
            if (this._nameSelection[i] !== 0) name += String.fromCharCode((i === 0 ? 65 : 97) + this._nameSelection[i]-1);
          this._internals.users.push({uid: this._generateUID(), name: name, icon: {background: this._backgroundColorSelection}});
          setCookie("users", JSON.stringify(this._internals.users));
          this.terminate();
        }
      }
    } else {
      if (this._inSidebar) this._inSidebar = false;
      else if (this._sidebarSelection === 0 && this._vertical === 1) this._showUserCreation = true;
    }
  }

  buttons_east = () => {
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
      else if (this._sidebarSelection === 2) {if (this._vertical > 0) this._vertical = 0;}
    }

    if (this._horizontal < 0) {
      this._inSidebar = true;
      this._horizontal = 0;
    } else {
      if (this._sidebarSelection === 0) {if (this._horizontal > 0) this._horizontal = 0;}
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
    this._sidebarSelection = 0;
    this._verticalPosition = 0;
    this._horizontalPosition = 0;
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

    this._appCount = Object.entries(this._internals.applications.external).length;
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

      if (this._reachedUserLimit) {
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text("You've reached the user limit (5).", new Point(16, 28));
        if (this._pressedToReset) {
          draw.dynamic.setColor("b22222");
          draw.dynamic.text("Restarting...", new Point(this._swemu.screen.width/2, this._swemu.screen.height/2), 16, null, null, true);
          if (!this._resetTimeout) setTimeout(() => {location.reload();}, 750);
          this._resetTimeout = true;
        } else {
          draw.dynamic.setColor("b22222");
          draw.dynamic.text("Press A to reset your Switch", new Point(this._swemu.screen.width/2-18, this._swemu.screen.height/2+7), 14, null, "bold", true);
        }
      } else {
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text("Create a user for your Switch. Use the D-pad control to navigate.", new Point(16, 28));
        if (!this._firstUser) draw.dynamic.text("Note: You can only add up to 5 users.", new Point(16, 52));
      }

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
        draw.dynamic.text("Preview", new Point(-preRadius*2-("Preview".length*7)-14, 7).add(preMid), 14);
        draw.dynamic.text(name, new Point(-4, 14+preRadius+4).add(preMid), 14, null, null, true);
      }

      // Render debug infos
      draw.dynamic.setColor("ffffff");
      draw.dynamic.text("S-UID: " + this._internals.uid, new Point(10, this._swemu.screen.height - 12), 9);

    } else {
      let sidebarWidth = this._inSidebar ? 160 : 120;

      draw.dynamic.setColor(this._inSidebar ? "2a2a2a" : "242424");
      draw.dynamic.rect(new Point(), new Point(sidebarWidth, this._swemu.screen.height));

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
        height += 14 + 60 + 24 + 10;
        let width = (60 + 10) * this._appCount;
        if (offset + width > this._swemu.screen.width - offset) width = this._swemu.screen.width - offset - 10;
        draw.dynamic.setColor(tSel ? "2a2a2a" : "242424");
        draw.dynamic.rect(new Point(offset, pHeight), new Point(offset + width, height));
        pHeight = height;


        tSel = !this._inSidebar && this._vertical === 1;

        height += 15 + 14;
        draw.dynamic.setColor(tSel ? "ffffff" : "dadada");
        draw.dynamic.text("Local users", new Point(offset, height), 14);
        pHeight = height + 14;

        // (40 for icon) + (2*12 for text) + (10 to bottom)
        height += 14 + 40 + 24 + 10;
        width = (60 + 10) * this._appCount;
        if (offset + width > this._swemu.screen.width - offset) width = this._swemu.screen.width - offset - 10;
        draw.dynamic.setColor(tSel ? "2a2a2a" : "242424");
        draw.dynamic.rect(new Point(offset, pHeight), new Point(offset + width, height));
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
        draw.dynamic.rect(new Point(offset, pHeight), new Point(offset + 140, height));
        // 140 ~ 13 chars ?
        draw.dynamic.setColor("ffffff");
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
        draw.dynamic.rect(new Point(offset, pHeight), new Point(offset + 280, height));
        // 280 ~ 27 chars ?
        draw.dynamic.setColor("ffffff");
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
        draw.dynamic.rect(new Point(offset, pHeight), new Point(offset + 370, height));
        // 370 ~ 36 chars
        draw.dynamic.setColor("ffffff");
        draw.dynamic.text(this._internals.uid, new Point(offset + 10, pHeight + 14 + 12), 14);
        pHeight = height;
      }
    }
  }
}

export class ControllerManager {
  static get NAME() {return "ControllerManager";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  buttons_east = () => {
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
  }
}

export class Gallery {
  static get NAME() {return "Gallery";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  buttons_east = () => {
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
  }
}

export class AddOnStore {
  static get NAME() {return "AddOnStore";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  buttons_east = () => {
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
  }
}

export class NewsApp {
  static get NAME() {return "NewsApp";}

  constructor(swemu) {
    this._swemu = swemu;
    this._terminated = false;
    this._internals = {};
  }

  buttons_east = () => {
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
  }
}
