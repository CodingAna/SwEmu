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

  // === Math.pow(a, e);
  exp: (a, e) => {
    let o = a;
    for (let i=1; i<e; i++) {
      o *= a;
    }
    return o;
  },

  clamp: (n, a, b) => {
    if (a === undefined || a === null) a = 0;
    if (b === undefined || b === null) [a, b] = [0, a];
    return a > n ? a : (b < n ? b : n);
  }
}
