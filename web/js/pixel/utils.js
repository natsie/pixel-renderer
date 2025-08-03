const _d = document;
export const arr = {
    at: (array, index) => {
        if (!num.sfInt(array === null || array === void 0 ? void 0 : array.length))
            throw new TypeError("`array` must be array-like.");
        if (!num.sfInt(index))
            return undefined;
        return array[index < 0 ? array.length + index : index];
    },
    clone: (array) => {
        const result = [];
        // `array` may be sparse
        for (let i = 0; i < array.length; i++)
            if (i in array)
                result[i] = array[i];
        return result;
    },
    flat: (array, depth) => {
        const result = arr.clone(array);
        const _depth = depth == null ? 1 : Math.max(0, ~~+depth);
        const stack = Array.from({ length: _depth + 1 }, () => ({
            arr: [],
            flat: [],
            i: 0,
        }));
        const blank = { arr: [], flat: [], i: 0 };
        const push = (dest, src, i) => {
            if (i in src)
                dest.push(src[i]);
            else
                dest.length++; // sparse array
        };
        let iter = 1e3;
        let si = 0;
        stack[0].arr = result;
        while (si >= 0) {
            if (iter-- <= 0)
                throw new RangeError("Maximum iteration exceeded.");
            const frame = stack[si];
            const { arr, flat, i } = stack[si];
            if (i >= arr.length) {
                if (si-- > 0)
                    stack[si].flat.push(...flat);
                continue;
            }
            if (!Array.isArray(arr[i]))
                push(flat, arr, i);
            else {
                const next = stack[si + 1];
                if (!next)
                    push(flat, arr, i);
                else {
                    next.arr = arr[i];
                    next.flat = [];
                    next.i = 0;
                    si++;
                }
            }
            frame.i++;
        }
        return stack[0].flat;
    },
    includes: (array, value) => array.some((el) => el === value),
    unique: (array) => Array.from(new Set(arr.clone(array))),
};
export const dom = {
    create: (tagName, options) => _d.createElement(tagName, options),
    css: (source) => {
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(`${source}`);
        return stylesheet;
    },
    frag: () => _d.createDocumentFragment(),
    query: (selector, parent = _d) => parent.querySelector(selector),
    queryAll: (selector, parent = _d) => parent.querySelectorAll(selector),
};
export const math = {
    bounded: (value, min, max) => value === math.clamp(value, min, max),
    clamp: (value, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) => {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    },
    round: (value) => Math.round(value),
};
export const misc = {
    emptyArr: [],
    emptyObj: {},
    emptyStr: "",
    element: dom.create("div"),
    lightthemequery: window.matchMedia("(prefers-color-scheme: light)"),
    get theme() {
        return misc.lightthemequery.matches ? "light" : "dark";
    },
};
export const num = {
    dec: (num) => (+num).toString().includes("."),
    int: (num) => Number.isInteger(num),
    palindrome: (num) => {
        const [i1 = "0", d1 = "0"] = num.toString().split(".");
        const [i2, d2] = [Array.from(i1).reverse().join(""), Array.from(d1).reverse().join("")];
        return i1 === i2 && d1 === d2;
    },
    sfInt: (num) => Number.isSafeInteger(num),
    Int: (num, roundingMode = "trunc") => {
        switch (roundingMode) {
            case "ceil":
                return Math.ceil(num);
            case "floor":
                return Math.floor(num);
            case "round":
                return Math.round(num);
            case "trunc":
                return Math.trunc(num);
            default:
                throw new Error(`Invalid rounding mode: ${roundingMode}`);
        }
    },
    Inv: (num) => 1 / num,
    Sqr: (num) => Math.pow(num, 2),
    Cbe: (num) => Math.pow(num, 3),
    Rev: (num) => +Array.from(num.toString()).reverse().join(""),
};
export const obj = {
    entries: (target) => {
        const result = [];
        for (const key in target)
            result.push([key, target[key]]);
        return result;
    },
    fromEntries: (entries) => {
        const result = {};
        for (const [key, value] of entries)
            result[key] = value;
        return result;
    },
    getProto: (target) => Object.getPrototypeOf(target),
    hasOwn: (target, prop) => Object.prototype.hasOwnProperty.call(target, prop),
    hasProp: (target, prop) => prop in target,
    isInstance: (target, cls) => target instanceof cls,
    isPureInstance: (target, cls) => obj.getProto(target) === cls.prototype,
};
export const str = {
    padStart: (input, maxLength, fillString = " ") => {
        // @ts-expect-error TypeScript is not too happy when you jump to the future (〜￣▽￣)〜
        if ("padStart" in String.prototype)
            return `${input}`.padStart(maxLength, fillString);
        if (!type.str(input)) {
            throw new TypeError("The `input` argument of the `str.padStart()` method must be a string.");
        }
        if (!num.sfInt(maxLength)) {
            throw new TypeError("The `maxLength` argument of the `str.padStart()` method must be a safe integer.");
        }
        if (fillString != null && !(fillString && type.str(fillString))) {
            throw new TypeError("The `fillString` argument of the `str.padStart()` method must be a non-empty string.");
        }
        if (input.length >= maxLength)
            return input;
        const fS = fillString !== null && fillString !== void 0 ? fillString : " ";
        const padLength = maxLength - input.length;
        return fS.repeat(Math.ceil(padLength / fS.length)).slice(0, padLength) + input;
    },
    padEnd: (input, maxLength, fillString = " ") => {
        // @ts-expect-error TypeScript is not too happy when you jump to the future (〜￣▽￣)〜
        if ("padEnd" in String.prototype)
            return `${input}`.padEnd(maxLength, fillString);
        if (!type.str(input)) {
            throw new TypeError("The `input` argument of the `str.padEnd()` method must be a string.");
        }
        if (!num.sfInt(maxLength)) {
            throw new TypeError("The `maxLength` argument of the `str.padEnd()` method must be a safe integer.");
        }
        if (fillString != null && !(fillString && type.str(fillString))) {
            throw new TypeError("The `fillString` argument of the `str.padEnd()` method must be a non-empty string.");
        }
        if (input.length >= maxLength)
            return input;
        const fS = fillString !== null && fillString !== void 0 ? fillString : " ";
        const padLength = maxLength - input.length;
        return input + fS.repeat(Math.ceil(padLength / fS.length)).slice(0, padLength);
    },
    camelCase: (input) => {
        if (!type.str(input)) {
            throw new TypeError("The `input` argument of the `str.camelCase()` method must be a string.");
        }
        const words = input.split(/[\s-_]/).filter(Boolean);
        return words.slice(1).reduce((res, cur) => res + cur[0].toUpperCase() + cur.slice(1), words[0]);
    },
    kebabCase: (input) => {
        if (!type.str(input)) {
            throw new TypeError("The `input` argument of the `str.kebabCase()` method must be a string.");
        }
        return input
            .split(/[\s-_]/)
            .filter(Boolean)
            .map((word) => word.toLowerCase())
            .join("-");
    },
    snakeCase: (input) => {
        if (!type.str(input)) {
            throw new TypeError("The `input` argument of the `str.snakeCase()` method must be a string.");
        }
        return input
            .split(/[\s-_]/)
            .filter(Boolean)
            .map((word) => word.toLowerCase())
            .join("_");
    },
    titleCase: (input) => {
        if (!type.str(input)) {
            throw new TypeError("The `input` argument of the `str.titleCase()` method must be a string.");
        }
        return input
            .split(/[\s-_]/)
            .filter(Boolean)
            .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    },
};
export const type = new Proxy((data) => typeof data, {
    set: (target, prop) => false,
    get: (target, prop) => {
        if (prop === "big")
            return (data) => target(data) === "bigint";
        if (prop === "bin")
            return (data) => ArrayBuffer.isView(data);
        if (prop === "nan")
            return (data) => Number.isNaN(data);
        if (prop === "num")
            return (data) => target(data) === "number";
        if (prop === "str")
            return (data) => target(data) === "string";
        if (prop === "sym")
            return (data) => target(data) === "symbol";
        if (prop === "obj")
            return (data) => target(data) === "object" && data !== null;
        if (prop === "fun")
            return (data) => target(data) === "function";
        if (prop === "und")
            return (data) => target(data) === "undefined";
        if (prop === "nul")
            return (data) => data === null;
        if (prop === "arr")
            return (data) => Array.isArray(data);
        if (prop === "map")
            return (data) => data instanceof Map;
        if (prop === "set")
            return (data) => data instanceof Set;
        if (prop === "ele")
            return (data) => data instanceof Element;
        return null;
    },
});
export const convertToPixels = (input) => {
    var _a;
    if (type.num(input) && !Number.isFinite(input))
        return input;
    if (!Number.isNaN(+input))
        return +input;
    const _i = `${input}`.trim().toLowerCase();
    const regex = /^([-+]?\d*.?\d+(?:e[-+]?\d+)?)\s*([a-z]*)$/i;
    const match = _i.match(regex);
    if (!match) {
        throw new TypeError(`Invalid input. The input, \`${_i}\`, did not match the testing regex.`);
    }
    const [_, _v, _u] = match;
    const v = Number.parseFloat(_v);
    const u = _u;
    if (!Number.isFinite(v))
        throw new TypeError("Expected a finite unit value.");
    switch (u) {
        case "":
        case "px":
            return v;
        case "vw":
            return (v / 100) * window.innerWidth;
        case "vh":
            return (v / 100) * window.innerHeight;
        case "vmin":
            return (v / 100) * Math.min(window.innerWidth, window.innerHeight);
        case "vmax":
            return (v / 100) * Math.max(window.innerWidth, window.innerHeight);
        case "cm":
        case "em":
        case "rem":
        case "in": {
            if (!type.fun(HTMLElement.prototype.computedStyleMap))
                return v * 16;
            !misc.element.parentElement && document.body.appendChild(misc.element);
            misc.element.style.setProperty("font-size", `${v.toPrecision(21)}${u}`);
            return (_a = misc.element.computedStyleMap().get("font-size")) === null || _a === void 0 ? void 0 : _a.value;
        }
        default:
            throw new TypeError(`Invalid input, \`${input}\`. Unknown unit encountered.`);
    }
};
export const isHTTPSuccessStatus = (s) => math.bounded(s, 200, 300) && num.sfInt(s);
export const readAsDataURL = (data, type) => {
    if (!data)
        throw new TypeError("BlobPart data is required.");
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(new Blob([data], type ? { type } : undefined));
    });
};
