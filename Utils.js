export let Utils = {
  startsWith: (string, start) => {
    return string.substring(0, start.length) === start;
  },
  fillStart: (string, char, length) => {
    let out = "";
    for (let i=0; i<length-string.length; i++) out += char;
    out += string;
    return out;
  },
  fillEnd: (string, char, length) => {
    let out = string;
    for (let i=0; i<length-string.length; i++) out += char;
    return out;
  },
}
