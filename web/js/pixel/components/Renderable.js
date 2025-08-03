import { convertToPixels, math, misc, str, type } from "../utils.js";
import Colour from "./Colour.js";
import Texture from "./Texture.js";
const validateOpts = {
    Canvas: (value, prop) => {
        if (value instanceof HTMLCanvasElement)
            return value;
        if (value instanceof OffscreenCanvas)
            return value;
        throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a canvas.`);
    },
    Colour: (value, prop) => {
        const tcProp = str.titleCase(prop);
        if (value instanceof Colour)
            return value;
        try {
            return Colour.from(value);
        }
        catch (_a) {
            throw new TypeError(`Invalid ${prop}. ${tcProp} must be an instance of \`Colour\` or a valid colour source.`);
        }
    },
    FiniteNumber: (value, prop) => {
        if (Number.isFinite(value))
            return +value;
        throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a finite number.`);
    },
    IntegerNumber: (value, prop) => {
        if (Number.isSafeInteger(value))
            return +value;
        throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a safe integer number.`);
    },
    Length: (value, prop) => {
        if (type.num(value))
            return validateOpts.FiniteNumber(value, prop);
        if (type.str(value)) {
            try {
                return convertToPixels(value);
            }
            catch (_a) {
                throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} could not be converted to pixels.`);
            }
        }
        throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a number or string.`);
    },
    PositiveNumber: (value, prop, allowZero = true) => {
        if (type.num(value) && (allowZero ? value >= 0 : value > 0))
            return +value;
        throw new TypeError(`Invalid ${prop}. ${str.titleCase(prop)} must be a positive number.`);
    },
    Vector: (value, prop) => {
        const tcProp = str.titleCase(prop);
        if (!Array.isArray(value))
            throw new TypeError(`Invalid ${prop}. ${tcProp} must be an array.`);
        if (value.length !== 2)
            throw new TypeError(`Invalid ${prop}. The length of the ${prop} vector must be two.`);
        if (!value.every((v) => Number.isFinite(v)))
            throw new TypeError(`Invalid ${prop}. ${tcProp} must be an array of finite numbers.`);
        return [value[0], value[1]];
    },
    shouldRender: (value) => !!value,
    angle: (value) => validateOpts.FiniteNumber(value, "angle") % 360,
    rotation: (value) => validateOpts.FiniteNumber(value, "rotation"),
    scale: (value) => validateOpts.Vector(value, "scale"),
    anchor: (value) => validateOpts.Vector(value, "anchor"),
    position: (value) => {
        if (typeof value !== "object" || value === null) {
            throw new TypeError("Invalid position. Position must be a non-null object.");
        }
        const result = { x: 0, y: 0, z: 0 };
        const props = ["x", "y", "z"];
        for (let i = 0; i < props.length; i++) {
            const prop = props[i];
            if (!(prop in value) || value[prop] === null)
                continue;
            try {
                result[prop] = validateOpts.FiniteNumber(value[prop], "null"); // We create our own error message because we want to use the prop name in the error message.
            }
            catch (_a) {
                throw new TypeError(`Invalid \`position.${prop}\`. All position properties must be finite numbers or null.`);
            }
        }
        return result;
    },
    size: (value) => {
        if (typeof value !== "object" || value === null) {
            throw new TypeError("Invalid size. Size must be a non-null object.");
        }
        const result = { width: 0, height: 0 };
        const props = ["width", "height"];
        for (let i = 0; i < props.length; i++) {
            const prop = props[i];
            if (!(prop in value) || value[prop] === null)
                continue;
            try {
                result[prop] = validateOpts.PositiveNumber(value[prop], "null"); // We create our own error message because we want to use the prop name in the error message.
            }
            catch (_a) {
                throw new TypeError(`Invalid \`size.${prop}\`. All size properties must be finite positive numbers or null.`);
            }
        }
        return result;
    },
    width: (value) => validateOpts.PositiveNumber(value, "width"),
    height: (value) => validateOpts.PositiveNumber(value, "height"),
    opacity: (value) => validateOpts.PositiveNumber(value, "opacity"),
    texture: (value) => {
        if (value instanceof Texture)
            return value;
        throw new TypeError("Invalid texture. Texture must be an instance of Texture");
    },
    textureOffset: (value) => validateOpts.Vector(value, "textureOffset"),
    textureScale: (value) => validateOpts.Vector(value, "textureScale"),
    style: (value) => validateStyle.all(value),
};
const validateStyle = {
    _props: {
        all: new Set([
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
    all: (value) => {
        if (!type.obj(value))
            throw new TypeError("Invalid style. Style must be an object.");
        const props = validateStyle._props.all;
        const $value = value;
        const result = {};
        for (const _prop in $value) {
            const prop = _prop;
            if (!(props.has(prop) && $value[prop] != null))
                continue;
            // @ts-expect-error
            result[prop] = validateStyle[prop]($value[prop]);
        }
        return result;
    },
    StringNumberVector: (value, prop) => {
        if (!type.arr(value)) {
            throw new TypeError(`Invalid \`${prop}\`. \`${prop}\` must be an array.`);
        }
        if (value.length !== 2) {
            throw new TypeError(`Invalid \`${prop}\`. \`${prop}\` must be an array of length two.`);
        }
        if (!value.every((v) => type.num(v) || type.str(v))) {
            throw new TypeError(`Invalid \`${prop}\`. \`${prop}\` must be an array of finite numbers or strings.`);
        }
        const result = [0, 0];
        const validate = (v) => {
            const vRegex = /^([-+]?\d*.?\d+(?:e[-+]?\d+)?)\s*([a-z%]*)$/i;
            if (type.str(v) && vRegex.test(v))
                return v;
            if (type.num(v) && !Number.isNaN(v))
                return v;
            throw new TypeError(`Invalid \`${prop}\`. Encountered invalid element, \`${v}\`, in array.`);
        };
        [result[0], result[1]] = [validate(value[0]), validate(value[1])];
        return result;
    },
    "background-colour": (value) => {
        if (value instanceof Colour)
            return value;
        throw new TypeError("Invalid `background-colour`. Expected an instance of Colour.");
    },
    "background-image": (value) => {
        if (value instanceof Texture)
            return value;
        throw new TypeError("Invalid `background-image`. Expected an instance of Texture.");
    },
    "background-position": (value) => validateStyle.StringNumberVector(value, "background-position"),
    "background-size": (value) => validateStyle.StringNumberVector(value, "background-size"),
    "font-family": (value) => {
        if (value && type.str(value))
            return value;
        throw new TypeError("Invalid `font-family`. `font-family` must be a non-empty string");
    },
    "font-size": (value) => {
        if (type.num(value) && Number.isFinite(value))
            return math.clamp(value, 0);
        if (value && type.str(value) && /^([-+]?\d*.?\d+(?:e[-+]?\d+)?)\s*([a-z%]*)$/i.test(value))
            return value;
        throw new TypeError("Invalid `font-size`. `font-size` must be a number or valid string");
    },
    "font-weight": (value) => {
        if (Number.isFinite(value) && value >= 0)
            return value;
        throw new TypeError("Invalid `font-weight`. `font-weight` must be a positive finite number.");
    },
    "foreground-colour": (value) => {
        if (value instanceof Colour)
            return value;
        throw new TypeError("Invalid `foreground-colour`. Expected an instance of Colour.");
    },
    "text-align": (value) => {
        const alignments = ["center", "left", "right", "start", "end"];
        const alignment = alignments[alignments.indexOf(value)];
        if (alignment)
            return alignment;
        throw new TypeError(`Invalid \`text-align\`. \`text-align\` must be one of "left", "right", "start", "end", or "center".`);
    },
    transform: (() => {
        const validationFunction = (value) => {
            if (!type.obj(value)) {
                throw new TypeError("Invalid `transform`. `transform` must be a non-null object.");
            }
            const props = validateStyle._props.transform;
            const $value = value;
            const result = {
                origin: null,
                rotate: null,
                scale: null,
                translate: null,
            };
            for (const _prop in $value) {
                const prop = _prop;
                if (!(props.has(prop) && $value[prop] != null))
                    continue;
                // @ts-expect-error
                result[prop] = validationFunction[prop]($value[prop]);
            }
            return result;
        };
        validationFunction.origin = (value) => {
            return validateStyle.StringNumberVector(value, "transform.origin");
        };
        validationFunction.rotate = (value) => {
            if (!(type.arr(value) &&
                value.every((v) => (v && type.str(v)) || (type.num(v) && Number.isFinite(v))))) {
                throw new TypeError("Invalid `transform.rotate`. `transform.rotate` must be an array of finite numbers or strings.");
            }
            if (value.length > 3) {
                throw new TypeError("Invalid `transform.rotate`. `transform.rotate` must be an array of length three or less.");
            }
            const result = [0, 0, 0];
            for (const [i, v] of value.entries()) {
                if (type.num(v))
                    result[i] = v;
                else if (/^([-+]?\d*.?\d+(?:e[-+]?\d+)?)\s*([a-z%]*)$/i.test(v))
                    result[i] = v;
                else
                    throw new TypeError(`Invaild \`transform.rotate\` (index ${i}). The element of type string did not match the testing regex.`);
            }
            return result;
        };
        validationFunction.scale = (value) => {
            return validateOpts.Vector(value, "transform.scale");
        };
        validationFunction.translate = (value) => {
            return validateStyle.StringNumberVector(value, "transform.translate");
        };
        return validationFunction;
    })(),
};
const assignOpts = (renderable, options) => {
    const { shouldRender, angle, rotation, scale, opacity, anchor, position, style } = options;
    if (shouldRender != null)
        renderable.shouldRender = validateOpts.shouldRender(shouldRender);
    if (angle != null)
        renderable.angle = validateOpts.angle(angle);
    if (rotation != null)
        renderable.rotation = validateOpts.rotation(rotation);
    if (scale != null)
        renderable.scale = validateOpts.scale(scale);
    if (opacity != null)
        renderable.opacity = validateOpts.opacity(opacity);
    if (anchor != null)
        renderable.anchor = validateOpts.anchor(anchor);
    if (position != null)
        renderable.position = validateOpts.position(position);
    if (style != null)
        renderable.style = validateOpts.style(style);
};
class Renderable {
    static get defaultStyleMap() {
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
    static get defaultOpts() {
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
    constructor(options = {}) {
        this.shouldRender = true;
        this.rotation = 0;
        this.opacity = 1;
        this.scale = [1, 1];
        this.anchor = [0, 0];
        this.position = { x: 0, y: 0, z: 0 };
        this.style = {};
        assignOpts(this, options);
    }
    get angle() {
        return (this.rotation * 180) / Math.PI;
    }
    set angle(value) {
        this.rotation = ((validateOpts.FiniteNumber(value, "angle") % 360) / 180) * Math.PI;
    }
}
export default Renderable;
export { validateOpts };
