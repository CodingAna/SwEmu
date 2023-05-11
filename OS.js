import { CustomDraw } from "./CustomDraw.js";
import { Point, Vector2D } from "./Geometry.js";
import { MyMath } from "./MyMath.js";
import { GamepadDummy } from "./GamepadDummy.js";
import { setCookie, getCookie } from "./Cookies.js";
// Import SystemApplications
import { HomeScreen, NewsApp, AddOnStore, Gallery, ControllerManager, Settings } from "./SystemApplications.js";

export class OS {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.context = context;

    // read-only => set up in constructor instead of init()
    this.swemu = {
      screen: {
        width: 630,
        height: 360,
        borderWidth: 50,
        borderHeight: 20,
      },
      joycon: {
        width: 130,
        height: 400,
      }
    };
  }

  // https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
  clone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  }

  addApp = (name, app) => {
    this.internals.applications.external[name] = app;
  }

  generateUID = () => {
    let uid = "";
    for (let i=1; i<=8+4+4+4+12; i++) {
      uid += parseInt(Math.random() * 16).toString(16);
      if (i === 8 || i === 8+4 || i === 8+4+4 || i === 8+4+4+4) uid += "-";
    }
    return uid;
  }

  renderSwitch = () => {
    // Blue JoyCon
    this.draw.static.setColor("00c3e3");
    this.draw.static.roundedRect(this.points.blueJoyConStart, this.points.blueJoyConEnd, 1);
    this.draw.static.rect(this.points.blueJoyConMid, this.points.blueJoyConEnd);

    // Display Border
    this.draw.static.setColor("414548");
    this.draw.static.rect(this.points.displayBorderStart, this.points.displayBorderEnd);

    // Red JoyCon
    this.draw.static.setColor("e60012");
    this.draw.static.roundedRect(this.points.redJoyConStart, this.points.redJoyConEnd, 1);
    this.draw.static.rect(this.points.redJoyConStart, this.points.redJoyConMid);
  }

  gamepadHandler = (event, connecting) => {
    if (connecting) {
      let players = Object.entries(this.gamepads);
      for (let i=0; i<players.length; i++) {
        let [pname, _] = players[i];
        if (this.gamepads[pname].id !== -1) continue;
        this.gamepads[pname] = new GamepadDummy(event.gamepad.index);
        break;
      }
    } else {
      let players = Object.entries(this.gamepads);
      for (let i=0; i<players.length; i++) {
        let [pname, _] = players[i];
        if (this.gamepads[pname].id !== event.gamepad.index) continue;
        this.gamepads[pname].id = -1;
        break;
      }
    }
  }

  getGamepadData = () => {
    if (this.render.input.verbose && !this.render.input.updated) {
      this.render.input.now = Date.now();
      this.render.input.updated = true;
    }

    let connectedGamepads = navigator.getGamepads();

    let players = Object.entries(this.gamepads);
    for (let i=0; i<players.length; i++) {
      let [_, player_gamepad] = players[i];
      if (player_gamepad.id === -1) continue;
      let gamepad = connectedGamepads[player_gamepad.id];

      player_gamepad.pressed.a = gamepad.buttons[0].pressed;
      player_gamepad.pressed.b = gamepad.buttons[1].pressed;
      player_gamepad.pressed.x = gamepad.buttons[2].pressed;
      player_gamepad.pressed.y = gamepad.buttons[3].pressed;
      player_gamepad.pressed.paused = gamepad.buttons[9].pressed;
      player_gamepad.pressed.dpad.up = gamepad.buttons[12].pressed;
      player_gamepad.pressed.dpad.down = gamepad.buttons[13].pressed;
      player_gamepad.pressed.dpad.left = gamepad.buttons[14].pressed;
      player_gamepad.pressed.dpad.right = gamepad.buttons[15].pressed;

      player_gamepad.trigger.left = 0;
      player_gamepad.trigger.right = 0;

      player_gamepad.joystick.left = new Vector2D(gamepad.axes[0], gamepad.axes[1]);
      // console.log([gamepad.axes[0], gamepad.axes[1]]); // [-0, -0]
      // console.log([player_gamepad.joystick.left.x, player_gamepad.joystick.left.y]); // [-0, -0]
      let ll = player_gamepad.joystick.left.length();
      // console.log(ll); // 0
      ll = MyMath.clamp(ll, 0, 1);
      // console.log(ll); // 0
      if (ll >= player_gamepad.joystick.deadzone) player_gamepad.joystick.used.left = true;
      else player_gamepad.joystick.used.left = false;
      player_gamepad.joystick.left.normalize().multiply(ll);
      // console.log([player_gamepad.joystick.left.x, player_gamepad.joystick.left.y]); // [NaN, NaN]

      player_gamepad.joystick.right = new Vector2D(gamepad.axes[2], gamepad.axes[3]);
      let rl = player_gamepad.joystick.right.length();
      rl = MyMath.clamp(rl, 0, 1);
      if (rl >= player_gamepad.joystick.deadzone) player_gamepad.joystick.used.right = true;
      else player_gamepad.joystick.used.right = false;
      player_gamepad.joystick.right.normalize().multiply(rl);
    }
  }

  renderGamepad = () => {
    let joyStickRadius = this.swemu.joycon.width/5;
    let buttonRadius = this.swemu.joycon.width/10;
    let pressedShrinkRadius = 2.5;

    // Left JoyCon
    let joyStickCenterLeft = new Point((this.swemu.joycon.width/2), (this.swemu.joycon.height/4));
    let joyStickPositionLeft = new Point(joyStickRadius*0.8*this.gamepads.player1.joystick.left.x, joyStickRadius*0.8*this.gamepads.player1.joystick.left.y).add(joyStickCenterLeft);

    this.draw.static.setColor("00c3e3");
    this.draw.static.rect(new Point(-joyStickRadius*2, -joyStickRadius*2).add(joyStickCenterLeft), new Point(joyStickRadius*2, joyStickRadius*2).add(joyStickCenterLeft));

    this.draw.static.setColor("212528");
    this.draw.static.arc(joyStickCenterLeft, joyStickRadius-10, false);
    this.draw.static.arc(joyStickCenterLeft, joyStickRadius-12, false);
    this.draw.static.arc(joyStickCenterLeft, joyStickRadius-14, false);
    this.draw.static.arc(joyStickPositionLeft, joyStickRadius);

    // Left Buttons
    let buttonCenterLeft = new Point((this.swemu.joycon.width/2), (this.swemu.joycon.height/2));

    this.draw.static.setColor("00c3e3");
    this.draw.static.rect(new Point(-buttonRadius*3, -buttonRadius*3).add(buttonCenterLeft), new Point(buttonRadius*3, buttonRadius*3).add(buttonCenterLeft));

    this.draw.static.setColor("212528");
    this.draw.static.arc(new Point(0, -buttonRadius*2).add(buttonCenterLeft), buttonRadius-(this.gamepads.player1.pressed.dpad.up ? pressedShrinkRadius : 0));
    this.draw.static.arc(new Point(buttonRadius*2, 0).add(buttonCenterLeft), buttonRadius-(this.gamepads.player1.pressed.dpad.right ? pressedShrinkRadius : 0));
    this.draw.static.arc(new Point(0, buttonRadius*2).add(buttonCenterLeft), buttonRadius-(this.gamepads.player1.pressed.dpad.down ? pressedShrinkRadius : 0));
    this.draw.static.arc(new Point(-buttonRadius*2, 0).add(buttonCenterLeft), buttonRadius-(this.gamepads.player1.pressed.dpad.left ? pressedShrinkRadius : 0));

    // Right JoyCon
    let joyStickCenterRight = new Point((this.swemu.joycon.width/2), (this.swemu.joycon.height/2)).add(this.points.redJoyConStart);
    let joyStickPositionRight = new Point(joyStickRadius*0.8*this.gamepads.player1.joystick.right.x, joyStickRadius*0.8*this.gamepads.player1.joystick.right.y).add(joyStickCenterRight);

    this.draw.static.setColor("e60012");
    this.draw.static.rect(new Point(-joyStickRadius*2, -joyStickRadius*2).add(joyStickCenterRight), new Point(joyStickRadius*2, joyStickRadius*2).add(joyStickCenterRight));

    this.draw.static.setColor("212528");
    this.draw.static.arc(joyStickCenterRight, joyStickRadius-10, false);
    this.draw.static.arc(joyStickCenterRight, joyStickRadius-12, false);
    this.draw.static.arc(joyStickCenterRight, joyStickRadius-14, false);
    this.draw.static.arc(joyStickPositionRight, joyStickRadius);

    // Right Buttons
    let buttonCenterRight = new Point((this.swemu.joycon.width/2), (this.swemu.joycon.height/4)).add(this.points.redJoyConStart);

    this.draw.static.setColor("e60012");
    this.draw.static.rect(new Point(-buttonRadius*3, -buttonRadius*3).add(buttonCenterRight), new Point(buttonRadius*3, buttonRadius*3).add(buttonCenterRight));

    this.draw.static.setColor("212528");
    this.draw.static.arc(new Point(0, -buttonRadius*2).add(buttonCenterRight), buttonRadius-(this.gamepads.player1.pressed.x ? pressedShrinkRadius : 0));
    this.draw.static.arc(new Point(buttonRadius*2, 0).add(buttonCenterRight), buttonRadius-(this.gamepads.player1.pressed.a ? pressedShrinkRadius : 0));
    this.draw.static.arc(new Point(0, buttonRadius*2).add(buttonCenterRight), buttonRadius-(this.gamepads.player1.pressed.b ? pressedShrinkRadius : 0));
    this.draw.static.arc(new Point(-buttonRadius*2, 0).add(buttonCenterRight), buttonRadius-(this.gamepads.player1.pressed.y ? pressedShrinkRadius : 0));

    let smaller = new Point(1, -1);
    this.draw.static.setColor("dadada");
    this.draw.static.text("X", new Point(-6, -buttonRadius*2+5).add(buttonCenterRight).add(this.gamepads.player1.pressed.x ? smaller : new Point()), this.gamepads.player1.pressed.x ? 10 : 12);
    this.draw.static.text("A", new Point(buttonRadius*2-5, 5).add(buttonCenterRight).add(this.gamepads.player1.pressed.a ? smaller : new Point()), this.gamepads.player1.pressed.a ? 10 : 12);
    this.draw.static.text("B", new Point(-5, buttonRadius*2+6).add(buttonCenterRight).add(this.gamepads.player1.pressed.b ? smaller : new Point()), this.gamepads.player1.pressed.b ? 10 : 12);
    this.draw.static.text("Y", new Point(-buttonRadius*2-6, 6).add(buttonCenterRight).add(this.gamepads.player1.pressed.y ? smaller : new Point()), this.gamepads.player1.pressed.y ? 10 : 12);
  }

  init = () => {
    this.started = false;
    this.terminated = false;

    this.draw = {
      static: new CustomDraw(this.canvas.static, this.context.static),
      dynamic: new CustomDraw(this.canvas.dynamic, this.context.dynamic),
    };

    this.swemu = {
      screen: {
        width: 630,
        height: 360,
        borderWidth: 50,
        borderHeight: 20,
      },
      joycon: {
        width: 130,
        height: 400,
      }
    }

    this.points = {
      zero: new Point(),

      blueJoyConStart: new Point(),
      blueJoyConMid: new Point(this.swemu.joycon.width / 2, 0),
      blueJoyConEnd: new Point(this.swemu.joycon.width, this.swemu.joycon.height),

      displayBorderStart: new Point(this.swemu.joycon.width, 0),
      displayBorderEnd: new Point(this.swemu.joycon.width, 0).add(
        new Point(this.swemu.screen.width, 0).add(
          new Point(this.swemu.screen.borderWidth, 0).multiply(2).add(
            new Point(0, this.canvas.static.height)
          )
        )
      ),

      redJoyConStart: new Point(this.swemu.joycon.width, 0).add(
        new Point(this.swemu.screen.width, 0).add(
          new Point(this.swemu.screen.borderWidth, 0).multiply(2)
        )
      ),
      redJoyConMid: new Point(this.swemu.joycon.width, 0).multiply(1.5).add(
        new Point(this.swemu.screen.width, 0).add(
          new Point(this.swemu.screen.borderWidth, 0).multiply(2).add(
            new Point(0, this.canvas.static.height)
          )
        )
      ),
      redJoyConEnd: new Point(this.swemu.joycon.width, 0).multiply(2).add(
        new Point(this.swemu.screen.width, 0).add(
          new Point(this.swemu.screen.borderWidth, 0).multiply(2).add(
            new Point(0, this.canvas.static.height)
          )
        )
      ),
    };

    // TODO: Create User class
    /*
    {
      uid: "6468adbc-aa33-4884-99a4-a0eb4bc7e083",
      name: "User 0",
      icon: {
        background: 0,
      },
    }
    */
    this.internals = {
      uid: null,
      users: [],
      applications: {
        system: {
          newsApp: NewsApp,
          addOnStore: AddOnStore,
          gallery: Gallery,
          controllerManager: ControllerManager,
          settings: Settings,
          homeScreen: HomeScreen
        },
        external: {}
      },
      settings: {
        debug: false
      }
    }

    this.gamepads = {
      player1: new GamepadDummy(),
      player2: new GamepadDummy(),
      player3: new GamepadDummy(),
      player4: new GamepadDummy()
    };

    this.render = {
      deltaTime: Date.now(),
      now: Date.now(),
      input: { // Used for debugging, if verbose === true: print delay (in ms) between (mousedown or mouseup or mousemove) and finished this.render
        verbose: true,
        delay: 0, // debug output (01.05.2023 22:50 => ~10ms (before obstacles and coins))
        now: 0,
        updated: false,
      },
      delayed: {
        deltaTime: Date.now(),
        input: {
          delay: 0,
        },
      }
    }

    if (getCookie("settings") === null) setCookie("settings", JSON.stringify(this.internals.settings), 30);
    this.internals.settings = JSON.parse(getCookie("settings"));

    if (getCookie("users") === null) setCookie("users", JSON.stringify(this.internals.users), 30);
    this.internals.users = JSON.parse(getCookie("users"));

    if (getCookie("s-uid") === null) setCookie("s-uid", this.generateUID(), 30);
    this.internals.uid = getCookie("s-uid");

    this.delayedInterval = setInterval(() => {}, 100);
  }

  start = () => {
    if (this.started) return;
    this.started = true;
    // Static / One-Time this.render
    this.renderSwitch();

    clearInterval(this.delayedInterval);
    this.delayedInterval = setInterval(() => {
      this.render.delayed.input.delay = this.render.input.delay;
      this.render.delayed.deltaTime = this.render.deltaTime;
    }, 100);

    this.homeScreen = new HomeScreen(this.swemu);
    this.homeScreen.init(this.internals);

    if (this.internals.users.length === 0) {
      let settings = new Settings(this.swemu);
      this.homeScreen._currentGame = settings.init(this.internals);
      this.homeScreen._paused = true;
      this.homeScreen._actionClick = 0;
    }

    this.render.now = Date.now();
    requestAnimationFrame(this.mainRenderer);
  }

  terminate = () => {
    this.terminated = true;
  }

  mainRenderer = () => {
    this.context.dynamic.clearRect(0, 0, this.canvas.dynamic.width, this.canvas.dynamic.height);
    if (!this.started || this.terminated) return;

    this.getGamepadData();
    this.renderGamepad();

    if (this.gamepads.player1.pressed.dpad.up) {
      if (!this.gamepads.player1.actions.dpad.up) {
        let timeoutDuration = this.gamepads.player1.actions.timeouts.dpad.duration.any;
        if (this.gamepads.player1.actions.timeouts.dpad.up.first) {
          timeoutDuration = this.gamepads.player1.actions.timeouts.dpad.duration.first;
          this.gamepads.player1.actions.timeouts.dpad.up.first = false;
        }
        clearTimeout(this.gamepads.player1.actions.timeouts.dpad.up.timeout);
        this.gamepads.player1.actions.timeouts.dpad.up.timeout = setTimeout(() => {this.gamepads.player1.actions.dpad.up = false;}, timeoutDuration);
        this.homeScreen.dpad_up(); // Maybe this need's some parameters. Not yet tho.
      }
      this.gamepads.player1.actions.dpad.up = true;
    } else {
      this.gamepads.player1.actions.dpad.up = false;
      this.gamepads.player1.actions.timeouts.dpad.up.first = true;
    }

    if (this.gamepads.player1.pressed.dpad.down) {
      if (!this.gamepads.player1.actions.dpad.down) {
        let timeoutDuration = this.gamepads.player1.actions.timeouts.dpad.duration.any;
        if (this.gamepads.player1.actions.timeouts.dpad.down.first) {
          timeoutDuration = this.gamepads.player1.actions.timeouts.dpad.duration.first;
          this.gamepads.player1.actions.timeouts.dpad.down.first = false;
        }
        clearTimeout(this.gamepads.player1.actions.timeouts.dpad.down.timeout);
        this.gamepads.player1.actions.timeouts.dpad.down.timeout = setTimeout(() => {this.gamepads.player1.actions.dpad.down = false;}, timeoutDuration);
        this.homeScreen.dpad_down(); // Maybe this need's some parameters. Not yet tho.
      }
      this.gamepads.player1.actions.dpad.down = true;
    } else {
      this.gamepads.player1.actions.dpad.down = false;
      this.gamepads.player1.actions.timeouts.dpad.down.first = true;
    }

    if (this.gamepads.player1.pressed.dpad.left) {
      if (!this.gamepads.player1.actions.dpad.left) {
        let timeoutDuration = this.gamepads.player1.actions.timeouts.dpad.duration.any;
        if (this.gamepads.player1.actions.timeouts.dpad.left.first) {
          timeoutDuration = this.gamepads.player1.actions.timeouts.dpad.duration.first;
          this.gamepads.player1.actions.timeouts.dpad.left.first = false;
        }
        clearTimeout(this.gamepads.player1.actions.timeouts.dpad.left.timeout);
        this.gamepads.player1.actions.timeouts.dpad.left.timeout = setTimeout(() => {this.gamepads.player1.actions.dpad.left = false;}, timeoutDuration);
        this.homeScreen.dpad_left(); // Maybe this need's some parameters. Not yet tho.
      }
      this.gamepads.player1.actions.dpad.left = true;
    } else {
      this.gamepads.player1.actions.dpad.left = false;
      this.gamepads.player1.actions.timeouts.dpad.left.first = true;
    }

    if (this.gamepads.player1.pressed.dpad.right) {
      if (!this.gamepads.player1.actions.dpad.right) {
        let timeoutDuration = this.gamepads.player1.actions.timeouts.dpad.duration.any;
        if (this.gamepads.player1.actions.timeouts.dpad.right.first) {
          timeoutDuration = this.gamepads.player1.actions.timeouts.dpad.duration.first;
          this.gamepads.player1.actions.timeouts.dpad.right.first = false;
        }
        clearTimeout(this.gamepads.player1.actions.timeouts.dpad.right.timeout);
        this.gamepads.player1.actions.timeouts.dpad.right.timeout = setTimeout(() => {this.gamepads.player1.actions.dpad.right = false;}, timeoutDuration);
        this.homeScreen.dpad_right(); // Maybe this need's some parameters. Not yet tho.
      }
      this.gamepads.player1.actions.dpad.right = true;
    } else {
      this.gamepads.player1.actions.dpad.right = false;
      this.gamepads.player1.actions.timeouts.dpad.right.first = true;
    }

    if (this.gamepads.player1.pressed.a) {
      if (!this.gamepads.player1.actions.a)
        this.homeScreen.buttons_a();
      this.gamepads.player1.actions.a = true;
    } else this.gamepads.player1.actions.a = false;

    if (this.gamepads.player1.pressed.b) {
      if (!this.gamepads.player1.actions.b)
        this.homeScreen.buttons_b();
      this.gamepads.player1.actions.b = true;
    } else this.gamepads.player1.actions.b = false;

    if (this.gamepads.player1.pressed.x) {
      if (!this.gamepads.player1.actions.x)
        this.homeScreen.buttons_x();
      this.gamepads.player1.actions.x = true;
    } else this.gamepads.player1.actions.x = false;

    if (this.gamepads.player1.pressed.y) {
      if (!this.gamepads.player1.actions.y)
        this.homeScreen.buttons_y();
      this.gamepads.player1.actions.y = true;
    } else this.gamepads.player1.actions.y = false;

    if (this.gamepads.player1.pressed.pause) {
      if (!this.gamepads.player1.actions.pause)
        this.homeScreen.buttons_pause();
      this.gamepads.player1.actions.pause = true;
    } else this.gamepads.player1.actions.pause = false;

    this.homeScreen.render(this.draw.dynamic, this.gamepads, this.render);

    let now = Date.now();
    this.render.deltaTime = (now - this.render.now) / 1000;
    this.render.now = now;
    if (this.render.input.verbose && this.render.input.updated) {
      this.render.input.delay = Date.now() - this.render.input.now;
      //console.log(this.render.input.delay);
      if (this.internals.settings.debug) {
        this.draw.dynamic.setColor("ffffff");
        this.draw.dynamic.text(""+this.render.delayed.input.delay+"ms", new Point(10+3, this.swemu.screen.height-10-7), 14);
        this.draw.dynamic.text(""+parseInt(1/this.render.delayed.deltaTime)+"fps", new Point(10+3+56, this.swemu.screen.height-10-7), 14);
      }
      this.render.input.updated = false;
    }

    requestAnimationFrame(this.mainRenderer);
  }
}
