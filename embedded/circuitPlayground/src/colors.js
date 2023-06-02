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

// From https://stackoverflow.com/a/44134328
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


Color.rgbToHsl = (r, g, b) => {
  /**
   * Converts an RGB color value to HSL. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and l in the set [0, 1].
   *
   * @param   {number}  r       The red color value
   * @param   {number}  g       The green color value
   * @param   {number}  b       The blue color value
   * @return  {Array}           The HSL representation
   */
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return new HSL(h * 360, s * 100, l * 100);
};


// https://stackoverflow.com/a/39077686
Color.rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}).join('');

Color.hexToRgb = hex => {
  return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
    , (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16));
};

export { Color, HSL };
