import sharedData from "../shared.ts";
import { str } from "../utils.ts";
import type { Bytes, IColour } from "../types.ts";

class Colour implements IColour.Instance {
  r: number;
  g: number;
  b: number;
  h: number;
  s: number;
  l: number;
  a: number;

  static get __dCD() {
    return Colour.defaultColourData;
  }

  static get defaultColourData(): IColour.Data {
    return {
      r: 0,
      g: 0,
      b: 0,
      h: 0,
      s: 0,
      l: 0,
      a: 0,
    };
  }

  static getCSSColourNameData(colour: string): IColour.Data | null {
    const context = sharedData.context.offscreen;
    const _colour = `${colour}`.toLowerCase().trim();

    context.reset();
    context.resetTransform();
    context.canvas.width = context.canvas.height = 1;

    context.fillStyle = _colour;
    context.fillRect(0, 0, 1, 1);

    const data = context.getImageData(0, 0, 1, 1).data;
    const rgba = { r: data[0], g: data[1], b: data[2], a: data[3] };

    return (data.every((channel) => channel === 255) && _colour !== "white") ||
      (data.slice(0, -1).every((channel) => channel === 0) &&
        data[3] === 255 &&
        _colour !== "black")
      ? null // the input was probably not a valid colour
      : Object.assign(Colour.__dCD, rgba, Colour.rgbToHsl(rgba));
  }

  static TRANSPARENT = Colour.from({ r: 0, g: 0, b: 0, a: 0 });
  static BLACK = Colour.from({ r: 0, g: 0, b: 0, a: 255 });
  static WHITE = Colour.from({ r: 255, g: 255, b: 255, a: 255 });
  static RED = Colour.from({ r: 255, g: 0, b: 0, a: 255 });
  static GREEN = Colour.from({ r: 0, g: 255, b: 0, a: 255 });
  static BLUE = Colour.from({ r: 0, g: 0, b: 255, a: 255 });
  static YELLOW = Colour.from({ r: 255, g: 255, b: 0, a: 255 });
  static MAGENTA = Colour.from({ r: 255, g: 0, b: 255, a: 255 });
  static CYAN = Colour.from({ r: 0, g: 255, b: 255, a: 255 });
  static get RANDOM() {
    return Colour.from(crypto.getRandomValues(new Uint8Array(3)))
  }

  static rgbToHsl(input: IColour.RGBFormat): IColour.HSLFormat {
    const r = input.r / 255;
    const g = input.g / 255;
    const b = input.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else {
        h = (r - g) / d + 4;
      }
      h /= 6;
    }
    const s = l > 0 && l < 1 ? d / (l < 0.5 ? 2 * l : 2 - 2 * l) : 0;
    return {
      h: h * 360,
      s: s * 100,
      l: l * 100,
      a: input.a,
    };
  }

  static hslToRgb(input: IColour.HSLFormat): IColour.RGBFormat {
    let h = input.h;
    const s = input.s / 100;
    const l = input.l / 100;
    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v, a: input.a ?? 255 };
    }
    h = h % 360;
    if (h < 0) h += 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    // biome-ignore lint/style/useSingleVarDeclarator: <explanation>
    let r = 0,
      g = 0,
      b = 0;
    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return { r, g, b, a: input.a ?? 255 };
  }

  static hwbToRgb(input: IColour.HWBFormat): IColour.RGBFormat {
    const h = input.h;
    let w = input.w / 100;
    let b = input.b / 100;
    if (w + b > 1) {
      const sum = w + b;
      w /= sum;
      b /= sum;
    }
    const rgb_c = Colour.hslToRgb({ h, s: 100, l: 50 });
    const r = (rgb_c.r * (1 - w) + 255 * w) * (1 - b);
    const g = (rgb_c.g * (1 - w) + 255 * w) * (1 - b);
    const b_val = (rgb_c.b * (1 - w) + 255 * w) * (1 - b);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b_val), a: input.a ?? 255 };
  }

  static stringParsers: [RegExp, (match: RegExpMatchArray) => IColour.Data][] = [
    [
      /(?:^#?([\da-f]{3,4})$)|(?:^#?((?:[\da-f]{2}){3,4})$)/i,
      function hexParser(match) {
        const pI = Number.parseInt;
        const hex = match[1] ?? match[2];
        const sl = match[1] != null ? 1 : 2;

        // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
        const _o = () => (_o.v += sl);
        _o.v = 0;

        const [_r, _g, _b, _a = "f"] = Array.from({ length: 4 }, () => hex.slice(_o.v, _o()));
        const r = pI(str.padStart(_r, 2, _r), 16);
        const g = pI(str.padStart(_g, 2, _g), 16);
        const b = pI(str.padStart(_b, 2, _b), 16);
        const a = !(hex.length % 4) ? pI(str.padStart(_a, 2, _a), 16) : 255;
        const rgb = { r, g, b, a };
        return Object.assign(Colour.defaultColourData, rgb, Colour.rgbToHsl(rgb), { a });
      },
    ],
    [
      /rgb(a)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d*\.?\d+)\s*)?\)/i,
      function rgbaParser(match) {
        const r = Number(match[2]);
        const g = Number(match[3]);
        const b = Number(match[4]);
        const a = match[6] ? Number(match[6]) * 255 : 255;
        const rgb = { r, g, b, a };
        return Object.assign(Colour.defaultColourData, rgb, Colour.rgbToHsl(rgb), { a });
      },
    ],
    [
      /hsl(a)?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(,\s*(\d*\.?\d+)\s*)?\)/i,
      function hslaParser(match) {
        const h = Number(match[2]);
        const s = Number(match[3]);
        const l = Number(match[4]);
        const a = match[6] ? Number(match[6]) * 255 : 255;
        const hsl = { h, s, l, a };
        const rgb = Colour.hslToRgb(hsl);
        return Object.assign(Colour.defaultColourData, rgb, hsl, { a });
      },
    ],
    [
      /hwb\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(,\s*(\d*\.?\d+)\s*)?\)/i,
      function hwbParser(match) {
        const h = Number(match[1]);
        const w = Number(match[2]);
        const b = Number(match[3]);
        const a = match[5] ? Number(match[5]) * 255 : 255;
        const hwb = { h, w, b, a };
        const rgb = Colour.hwbToRgb(hwb);
        const hsl = Colour.rgbToHsl(rgb);
        return Object.assign(Colour.defaultColourData, rgb, hsl, { a });
      },
    ],
  ];

  static from(input: IColour.Source): Colour {
    if (!input) throw new TypeError("No input provided");

    if (typeof input === "number") {
      const r = (input >> 16) & 0xff;
      const g = (input >> 8) & 0xff;
      const b = input & 0xff;
      const a = 255;
      const rgb = { r, g, b, a };
      return new Colour(Object.assign(Colour.defaultColourData, rgb, Colour.rgbToHsl(rgb), { a }));
    }

    if (typeof input === "string") {
      for (const [regex, parser] of Colour.stringParsers) {
        const match = input.match(regex);
        if (match) return new Colour(parser(match));
      }

      const data = Colour.getCSSColourNameData(input);
      if (data) return new Colour(data);

      throw new TypeError("Unsupported string format.");
    }

    if (input instanceof Uint8Array) {
      if ([3, 4].some(l => l===input.length)) {
        const [r, g, b, a = 255] = input;
        const rgb = { r, g, b, a };
        return new Colour(Object.assign(Colour.__dCD, rgb, Colour.rgbToHsl(rgb)));
      }

      throw new TypeError("Invalid bytes length");
    }

    if (typeof input === "object") {
      if ("r" in input) {
        const rgb = input as IColour.RGBFormat;
        const a = rgb.a ?? 255;
        const hsl = Colour.rgbToHsl(rgb);
        return new Colour(Object.assign(Colour.defaultColourData, rgb, hsl, { a }));
      }

      if ("s" in input) {
        const hsl = input as IColour.HSLFormat;
        const a = hsl.a ?? 255;
        const rgb = Colour.hslToRgb(hsl);
        return new Colour(Object.assign(Colour.defaultColourData, rgb, hsl, { a }));
      }

      if ("w" in input) {
        const hwb = input as IColour.HWBFormat;
        const a = hwb.a ?? 255;
        const rgb = Colour.hwbToRgb(hwb);
        const hsl = Colour.rgbToHsl(rgb);
        return new Colour(Object.assign(Colour.defaultColourData, rgb, hsl, { a }));
      }

      throw new TypeError("Invalid colour format");
    }

    throw new TypeError("Unsupported input type");
  }

  constructor(data: IColour.Data) {
    this.r = data.r;
    this.g = data.g;
    this.b = data.b;
    this.h = data.h;
    this.s = data.s;
    this.l = data.l;
    this.a = data.a;
  }

  toHex(): string {
    const r = str.padStart(this.r.toString(16), 2, "0");
    const g = str.padStart(this.g.toString(16), 2, "0");
    const b = str.padStart(this.b.toString(16), 2, "0");
    const a = str.padStart(this.a.toString(16), 2, "0");
    return `#${r}${g}${b}${this.a < 255 ? a : ""}`;
  }

  toRgb(): string {
    const a = this.a / 255;
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${a.toFixed(2)})`;
  }

  toHsl(): string {
    const s = this.s.toFixed(2);
    const l = this.l.toFixed(2);
    const a = (this.a / 255).toFixed(2);
    return `hsla(${this.h.toFixed(2)}, ${s}%, ${l}%, ${a})`;
  }

  toHwb(): string {
    const min = Math.min(this.r, this.g, this.b) / 255;
    const max = Math.max(this.r, this.g, this.b) / 255;
    const w = min * 100;
    const b = (1 - max) * 100;
    const a = (this.a / 255).toFixed(2);
    return `hwb(${this.h.toFixed(2)}, ${w.toFixed(2)}%, ${b.toFixed(2)}%, ${a})`;
  }

  toInt(): number {
    return (this.r << 16) | (this.g << 8) | this.b;
  }

  toBytes(): Bytes {
    return new Uint8Array([this.r, this.g, this.b, this.a]);
  }

  toNumber(): number {
    return this.toInt();
  }

  toString(): string {
    return this.toHex();
  }

  toInverse(): Colour {
    const rgb = { r: 255 - this.r, g: 255 - this.g, b: 255 - this.b, a: this.a };
    const hsl = Colour.rgbToHsl(rgb);
    return new Colour(Object.assign(Colour.defaultColourData, rgb, hsl, { a: this.a }));
  }
}

export default Colour;
