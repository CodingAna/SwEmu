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
  generateUID: () => {
    let uid = "";
    for (let i=1; i<=8+4+4+4+12; i++) {
      uid += parseInt(Math.random() * 16).toString(16);
      if (i === 8 || i === 8+4 || i === 8+4+4 || i === 8+4+4+4) uid += "-";
    }
    return uid;
  },
  generateRoomCode: (length) => {
    if (length === undefined || length === null) length = 4;
    let code = "";
    for (let i=0; i<length; i++) code += parseInt(Math.random() * 16).toString(16);
    return code.toUpperCase();
  },
}
