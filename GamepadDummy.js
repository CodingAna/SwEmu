import { Vector2D } from "./Geometry.js";

export class GamepadDummy {
  constructor(id) {
    if (id === undefined || id === null) id = -1;
    this.id = id;
    this.pressed = {
      a: false,
      b: false,
      x: false,
      y: false,
      dpad: {
        up: false,
        down: false,
        left: false,
        right: false
      },
      pause: false,
      rb: false,
      lb: false
    };
    this.trigger = {
      left: 0,
      right: 0
    };
    this.joystick = {
      used: {
        left: false,
        right: false
      },
      deadzone: 0.065,
      left: new Vector2D(),
      right: new Vector2D()
    };
    this.actions = {
      timeouts: {
        dpad: {
          duration: {
            first: 425,
            any: 145
          },
          up: {
            first: true,
            timeout: setTimeout(() => {}, 1)
          },
          down: {
            first: true,
            timeout: setTimeout(() => {}, 1)
          },
          left: {
            first: true,
            timeout: setTimeout(() => {}, 1)
          },
          right: {
            first: true,
            timeout: setTimeout(() => {}, 1)
          },
        }
      },
      a: false,
      b: false,
      x: false,
      y: false,
      pause: false,
      dpad: {
        up: false,
        down: false,
        left: false,
        right: false
      }
    };
  }
}
