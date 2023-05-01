export let MyMath = {
  abs: (a) => {
    return (a > 0) ? a : -a;
  },

  min: (a, b) => {
    return (a < b) ? a : b;
  },

  max: (a, b) => {
    return (a > b) ? a : b;
  },

  exp: (a, e) => {
    let o = a;
    for (let i=1; i<e; i++) {
      o *= a;
    }
    return o;
  },
}
