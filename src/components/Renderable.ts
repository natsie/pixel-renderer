import type { Any, IRenderable, IRenderer } from "../types.ts";

import { arr, convertToPixels, math, misc, obj, str, type } from "../utils.ts";
import Colour from "./Colour.ts";
import Texture from "./Texture.ts";

const validateOpts = {
  Canvas: (value: Any, prop: string): IRenderer.Canvas => {
    if (value instanceof HTMLCanvasElement) return value;
    if (value instanceof OffscreenCanvas) return value;
    throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a canvas.`);
  },
  Colour: (value: Any, prop: string): Colour => {
    const tcProp = str.titleCase(prop);
    if (value instanceof Colour) return value;
    try {
      return Colour.from(value);
    } catch {
      throw new TypeError(
        `Invalid ${prop}. ${tcProp} must be an instance of \`Colour\` or a valid colour source.`,
      );
    }
  },
  FiniteNumber: (value: Any, prop: string): number => {
    if (Number.isFinite(value)) return +value;
    throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a finite number.`);
  },
  IntegerNumber: (value: Any, prop: string): number => {
    if (Number.isSafeInteger(value)) return +value;
    throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a safe integer number.`);
  },
  Length: (value: Any, prop: string): number => {
    if (type.num(value)) return validateOpts.FiniteNumber(value, prop);
    if (type.str(value)) {
      try {
        return convertToPixels(value);
      } catch {
        throw new TypeError(
          `Invalid ${prop}. ${str.titleCase(prop)} could not be converted to pixels.`,
        );
      }
    }

    throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a number or string.`);
  },
  PositiveNumber: (value: Any, prop: string, allowZero = true): number => {
    if (type.num(value) && (allowZero ? value >= 0 : value > 0)) return +value;
    throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a positive number.`);
  },
  Vector: (value: Any, prop: string): IRenderer.Vector => {
    const tcProp = str.titleCase(prop);
    if (!Array.isArray(value)) throw new TypeError(`Invalid ${prop}. ${tcProp} must be an array.`);
    if (value.length !== 2)
      throw new TypeError(`Invalid ${prop}. The length of the ${prop} vector must be two.`);
    if (!value.every((v) => Number.isFinite(v)))
      throw new TypeError(`Invalid ${prop}. ${tcProp} must be an array of finite numbers.`);

    return [value[0], value[1]];
  },
  shouldRender: (value: Any): boolean => !!value,
  angle: (value: Any): number => validateOpts.FiniteNumber(value, "angle") % 360,
  rotation: (value: Any): number => validateOpts.FiniteNumber(value, "rotation"),
  scale: (value: Any): IRenderer.Vector => validateOpts.Vector(value, "scale"),
  anchor: (value: Any): IRenderer.Vector => validateOpts.Vector(value, "anchor"),
  position: (value: Any): IRenderer.Position => {
    if (typeof value !== "object" || value === null) {
      throw new TypeError("Invalid position. Position must be a non-null object.");
    }

    const result: IRenderer.Position = { x: 0, y: 0, z: 0 };
    const props: (keyof IRenderer.Position)[] = ["x", "y", "z"];

    for (let i = 0; i < props.length; i++) {
      const prop = props[i];
      if (!(prop in value) || value[prop] === null) continue;
      try {
        result[prop] = validateOpts.FiniteNumber(value[prop], "null"); // We create our own error message because we want to use the prop name in the error message.
      } catch {
        throw new TypeError(
          `Invalid \`position.${prop}\`. All position properties must be finite numbers or null.`,
        );
      }
    }

    return result;
  },
  size: (value: Any): IRenderer.Size => {
    if (typeof value !== "object" || value === null) {
      throw new TypeError("Invalid size. Size must be a non-null object.");
    }

    const result: IRenderer.Size = { width: 0, height: 0 };
    const props: (keyof IRenderer.Size)[] = ["width", "height"];

    for (let i = 0; i < props.length; i++) {
      const prop = props[i];
      if (!(prop in value) || value[prop] === null) continue;
      try {
        result[prop] = validateOpts.PositiveNumber(value[prop], "null"); // We create our own error message because we want to use the prop name in the error message.
      } catch {
        throw new TypeError(
          `Invalid \`size.${prop}\`. All size properties must be finite positive numbers or null.`,
        );
      }
    }

    return result;
  },
  width: (value: Any): number => validateOpts.PositiveNumber(value, "width"),
  height: (value: Any): number => validateOpts.PositiveNumber(value, "height"),
  opacity: (value: Any): number => validateOpts.PositiveNumber(value, "opacity"),
  texture: (value: Any): Texture => {
    if (value instanceof Texture) return value;
    throw new TypeError("Invalid texture. Texture must be an instance of Texture");
  },
  textureOffset: (value: Any): IRenderer.Vector => validateOpts.Vector(value, "textureOffset"),
  textureScale: (value: Any): IRenderer.Vector => validateOpts.Vector(value, "textureScale"),
  style: (value: Any): IRenderable.PartialStyleMap => validateStyle.all(value),
};

const validateStyle = {
  _props: {
    all: new Set<keyof IRenderable.StyleMap>([
      "background-colour",
      "background-image",
      "background-position",
      "background-size",
      "font-family",
      "font-size",
      "font-weight",
      "foreground-colour",
      "text-align",
      "transform",
    ]),
    transform: new Set(["origin", "rotate", "scale", "translate"]),
  },
  all: (value: Any): IRenderable.PartialStyleMap => {
    if (!type.obj(value)) throw new TypeError("Invalid style. Style must be an object.");

    const props = validateStyle._props.all;
    const $value = value as IRenderable.PartialStyleMap;
    const result: IRenderable.PartialStyleMap = {};

    for (const _prop in $value) {
      const prop = _prop as keyof IRenderable.StyleMap;
      if (!(props.has(prop) && $value[prop] != null)) continue;

      // @ts-expect-error
      result[prop] = validateStyle[prop]($value[prop]);
    }

    return result;
  },
  StringNumberVector: (value: Any, prop: string): IRenderer.StringNumberVector => {
    if (!type.arr(value)) {
      throw new TypeError(`Invalid \`${prop}\`. \`${prop}\` must be an array.`);
    }

    if (value.length !== 2) {
      throw new TypeError(`Invalid \`${prop}\`. \`${prop}\` must be an array of length two.`);
    }

    if (!value.every((v) => type.num(v) || type.str(v))) {
      throw new TypeError(
        `Invalid \`${prop}\`. \`${prop}\` must be an array of finite numbers or strings.`,
      );
    }

    const result: IRenderer.StringNumberVector = [0, 0];
    const validate = (v: Any) => {
      const vRegex = /^([-+]?\d*.?\d+(?:e[-+]?\d+)?)\s*([a-z%]*)$/i;

      if (type.str(v) && vRegex.test(v)) return v;
      if (type.num(v) && !Number.isNaN(v)) return v;

      throw new TypeError(`Invalid \`${prop}\`. Encountered invalid element, \`${v}\`, in array.`);
    };

    [result[0], result[1]] = [validate(value[0]), validate(value[1])];
    return result;
  },
  "background-colour": (value: Any): Colour => {
    if (value instanceof Colour) return value;
    throw new TypeError("Invalid `background-colour`. Expected an instance of Colour.");
  },
  "background-image": (value: Any): Texture => {
    if (value instanceof Texture) return value;
    throw new TypeError("Invalid `background-image`. Expected an instance of Texture.");
  },
  "background-position": (value: Any): IRenderer.StringNumberVector =>
    validateStyle.StringNumberVector(value, "background-position"),
  "background-size": (value: Any): IRenderer.StringNumberVector =>
    validateStyle.StringNumberVector(value, "background-size"),
  "font-family": (value: Any): string => {
    if (value && type.str(value)) return value;
    throw new TypeError("Invalid `font-family`. `font-family` must be a non-empty string");
  },
  "font-size": (value: Any): string | number => {
    if (type.num(value) && Number.isFinite(value)) return math.clamp(value, 0);
    if (value && type.str(value) && /^([-+]?\d*.?\d+(?:e[-+]?\d+)?)\s*([a-z%]*)$/i.test(value))
      return value;
    throw new TypeError("Invalid `font-size`. `font-size` must be a number or valid string");
  },
  "font-weight": (value: Any): number => {
    if (Number.isFinite(value) && value >= 0) return value;
    throw new TypeError("Invalid `font-weight`. `font-weight` must be a positive finite number.");
  },
  "foreground-colour": (value: Any): Colour => {
    if (value instanceof Colour) return value;
    throw new TypeError("Invalid `foreground-colour`. Expected an instance of Colour.");
  },
  "text-align": (value: Any): CanvasTextAlign => {
    const alignments: CanvasTextAlign[] = ["center", "left", "right", "start", "end"];
    const alignment = alignments[alignments.indexOf(value)];

    if (alignment) return alignment;
    throw new TypeError(
      `Invalid \`text-align\`. \`text-align\` must be one of "left", "right", "start", "end", or "center".`,
    );
  },
  transform: (() => {
    const validationFunction: {
      (value: Any): NonNullable<IRenderable.PartialStyleMap["transform"]>;
      origin: (value: Any) => IRenderer.StringNumberVector;
      rotate: (
        value: Any,
      ) => NonNullable<NonNullable<IRenderable.PartialStyleMap["transform"]>["rotate"]>;
      scale: (value: Any) => IRenderer.Vector;
      translate: (value: Any) => IRenderer.StringNumberVector;
    } = (value: Any): NonNullable<IRenderable.PartialStyleMap["transform"]> => {
      if (!type.obj(value)) {
        throw new TypeError("Invalid `transform`. `transform` must be a non-null object.");
      }

      const props = validateStyle._props.transform;
      const $value = value as NonNullable<IRenderable.PartialStyleMap["transform"]> & {};
      const result: NonNullable<IRenderable.PartialStyleMap["transform"]> = {
        origin: null,
        rotate: null,
        scale: null,
        translate: null,
      };

      for (const _prop in $value) {
        const prop = _prop as keyof typeof $value;
        if (!(props.has(prop) && $value[prop] != null)) continue;

        // @ts-expect-error
        result[prop] = validationFunction[prop]($value[prop]);
      }

      return result;
    };

    validationFunction.origin = (value: Any): IRenderer.StringNumberVector => {
      return validateStyle.StringNumberVector(value, "transform.origin");
    };

    validationFunction.rotate = (value: Any): IRenderable.StyleMap["transform"]["rotate"] => {
      if (
        !(
          type.arr(value) &&
          value.every((v) => (v && type.str(v)) || (type.num(v) && Number.isFinite(v)))
        )
      ) {
        throw new TypeError(
          "Invalid `transform.rotate`. `transform.rotate` must be an array of finite numbers or strings.",
        );
      }

      if (value.length > 3) {
        throw new TypeError(
          "Invalid `transform.rotate`. `transform.rotate` must be an array of length three or less.",
        );
      }

      const result: IRenderable.StyleMap["transform"]["rotate"] = [0, 0, 0];
      for (const [i, v] of value.entries()) {
        if (type.num(v)) result[i] = v;
        else if (/^([-+]?\d*.?\d+(?:e[-+]?\d+)?)\s*([a-z%]*)$/i.test(v)) result[i] = v;
        else
          throw new TypeError(
            `Invaild \`transform.rotate\` (index ${i}). The element of type string did not match the testing regex.`,
          );
      }
      return result;
    };

    validationFunction.scale = (value: Any): IRenderer.Vector => {
      return validateOpts.Vector(value, "transform.scale");
    };

    validationFunction.translate = (value: Any): IRenderer.StringNumberVector => {
      return validateStyle.StringNumberVector(value, "transform.translate");
    };

    return validationFunction;
  })(),
};

const assignOpts = (renderable: Renderable, options: IRenderable.Config) => {
  const { shouldRender, angle, rotation, scale, opacity, anchor, position, style } = options;

  if (shouldRender != null) renderable.shouldRender = validateOpts.shouldRender(shouldRender);
  if (angle != null) renderable.angle = validateOpts.angle(angle);
  if (rotation != null) renderable.rotation = validateOpts.rotation(rotation);
  if (scale != null) renderable.scale = validateOpts.scale(scale);
  if (opacity != null) renderable.opacity = validateOpts.opacity(opacity);
  if (anchor != null) renderable.anchor = validateOpts.anchor(anchor);
  if (position != null) renderable.position = validateOpts.position(position);
  if (style != null) renderable.style = validateOpts.style(style);
};

class Renderable implements IRenderable.Instance {
  shouldRender = true;
  rotation = 0;
  opacity = 1;
  scale: IRenderer.Vector = [1, 1];
  anchor: IRenderer.Vector = [0, 0];
  position: IRenderer.Position = { x: 0, y: 0, z: 0 };
  style: IRenderable.PartialStyleMap = {};

  static get defaultStyleMap(): IRenderable.StyleMap {
    return {
      "background-colour": Colour.TRANSPARENT,
      "background-image": Texture.TRANSPARENT,
      "background-position": ["0%", "0%"],
      "background-size": [1, 1],
      "font-family": "serif",
      "font-size": "16px",
      "font-weight": 500,
      "foreground-colour": Colour[misc.theme === "light" ? "BLACK" : "WHITE"],
      "text-align": "start",
      transform: {
        origin: [0, 0],
        rotate: ["0deg", "0deg", "0deg"],
        scale: [1, 1],
        translate: ["0px", "0px"],
      },
    };
  }
  static get defaultOpts(): IRenderable.Options {
    return {
      shouldRender: true,
      angle: 0,
      rotation: 0,
      opacity: 1,
      scale: [1, 1],
      anchor: [0, 0],
      position: { x: 0, y: 0, z: 0 },
      style: {},
    };
  }

  constructor(options: IRenderable.Config = {}) {
    assignOpts(this, options);
  }

  get angle(): number {
    return (this.rotation * 180) / Math.PI;
  }

  set angle(value: number) {
    this.rotation = ((validateOpts.FiniteNumber(value, "angle") % 360) / 180) * Math.PI;
  }
}

export default Renderable;
export { validateOpts };
