class HSL {
  h;
  s;
  l;
  constructor(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
  }
}

class Color { };
// returns an array of hsl colors with a given number of stops along the way
// The final array includes the start and stop values, so a zero-stop would be two colors
// start and stop are both 
Color.hslColorStops = (start, stop, numStops) => {
  const rangeH = stop.h - start.h;
  const rangeS = stop.s - start.s;
  const rangeL = stop.l - start.l;

  const pctChunk = 1 / (numStops + 1);
  const hChunk = rangeH * pctChunk;
  const sChunk = rangeS * pctChunk;
  const lChunk = rangeL * pctChunk;

  let colors = [];

  for (let ii = 0; ii <= numStops + 1; ii++) {
    let h, s, l;
    h = start.h + ii * hChunk;
    s = start.s + ii * sChunk;
    l = start.l + ii * lChunk;
    colors.push(new HSL(h, s, l));
  }
  return colors;
};

Color.hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `${f(0)}${f(8)}${f(4)}`;
};


export { Color, HSL };
