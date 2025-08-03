import type { Any, AnyObject, AnyFunction, FlatArray } from "./types.ts";

type ElCOpt = ElementCreationOptions;
type DOMQueryable = Document | DocumentFragment | Element | ShadowRoot;
interface DOMUtils {
  create: typeof Document.prototype.createElement;
  css: (source: string) => CSSStyleSheet;
  frag: () => DocumentFragment;
  query: {
    <K extends keyof HTMLElementTagNameMap>(
      selector: K,
      parent?: DOMQueryable,
    ): HTMLElementTagNameMap[K] | null;
    <K extends keyof HTMLElementDeprecatedTagNameMap>(
      selector: K,
      parent?: DOMQueryable,
    ): HTMLElementDeprecatedTagNameMap[K] | null;
    <K extends keyof SVGElementTagNameMap>(
      selector: K,
      parent?: DOMQueryable,
    ): SVGElementTagNameMap[K] | null;
    <K extends keyof MathMLElementTagNameMap>(
      selector: K,
      parent?: DOMQueryable,
    ): MathMLElementTagNameMap[K] | null;
    (selector: string, parent?: DOMQueryable): Element | null;
  };
  queryAll: {
    <K extends keyof HTMLElementTagNameMap>(
      selector: K,
      parent?: DOMQueryable,
    ): NodeListOf<HTMLElementTagNameMap[K]>;
    <K extends keyof HTMLElementDeprecatedTagNameMap>(
      selector: K,
      parent?: DOMQueryable,
    ): NodeListOf<HTMLElementDeprecatedTagNameMap[K]>;
    <K extends keyof SVGElementTagNameMap>(
      selector: K,
      parent?: DOMQueryable,
    ): NodeListOf<SVGElementTagNameMap[K]>;
    <K extends keyof MathMLElementTagNameMap>(
      selector: K,
      parent?: DOMQueryable,
    ): NodeListOf<MathMLElementTagNameMap[K]>;
    (selector: string, parent?: DOMQueryable): NodeListOf<Element>;
  };
}

const _d = document;

export const arr = {
  at: <T>(array: ArrayLike<T>, index: number): T | undefined => {
    if (!num.sfInt(array?.length)) throw new TypeError("`array` must be array-like.");
    if (!num.sfInt(index)) return undefined;

    return array[index < 0 ? array.length + index : index];
  },
  clone: <T>(array: ArrayLike<T>): T[] => {
    const result: T[] = [];
    // `array` may be sparse
    for (let i = 0; i < array.length; i++) if (i in array) result[i] = array[i];
    return result;
  },
  flat: <A extends Any[], D extends number = 1>(
    array: A,
    depth?: D | undefined,
  ): FlatArray<A, D>[] => {
    const result = arr.clone(array);
    const _depth = depth == null ? 1 : Math.max(0, ~~+depth);
    const stack = Array.from({ length: _depth + 1 }, () => ({
      arr: [] as Any[],
      flat: [] as Any[],
      i: 0,
    }));
    const blank = { arr: [] as Any[], flat: [] as Any[], i: 0 };
    const push = (dest: Any[], src: Any[], i: number) => {
      if (i in src) dest.push(src[i]);
      else dest.length++; // sparse array
    };
    let iter = 1e3;
    let si = 0;

    stack[0].arr = result;
    while (si >= 0) {
      if (iter-- <= 0) throw new RangeError("Maximum iteration exceeded.");

      const frame = stack[si];
      const { arr, flat, i } = stack[si];
      if (i >= arr.length) {
        if (si-- > 0) stack[si].flat.push(...flat);
        continue;
      }

      if (!Array.isArray(arr[i])) push(flat, arr, i);
      else {
        const next = stack[si + 1];
        if (!next) push(flat, arr, i);
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
  includes: (array: Any[], value: Any) => array.some((el) => el === value),
  unique: <T>(array: ArrayLike<T>): T[] => Array.from(new Set(arr.clone(array))),
};

export const dom: DOMUtils = {
  create: (tagName: string, options?: ElCOpt) => _d.createElement(tagName, options),
  css: (source: string) => {
    const stylesheet = new CSSStyleSheet();

    stylesheet.replaceSync(`${source}`);
    return stylesheet;
  },
  frag: () => _d.createDocumentFragment(),
  query: (selector: string, parent: DOMQueryable = _d) => parent.querySelector(selector),
  queryAll: (selector: string, parent: DOMQueryable = _d) => parent.querySelectorAll(selector),
};

export const math = {
  bounded: (value: number, min: number, max: number) => value === math.clamp(value, min, max),
  clamp: (value: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  },
  round: (value: number) => Math.round(value),
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
  dec: (num: number) => (+num).toString().includes("."),
  int: (num: unknown) => Number.isInteger(num),
  palindrome: (num: number) => {
    const [i1 = "0", d1 = "0"] = num.toString().split(".");
    const [i2, d2] = [Array.from(i1).reverse().join(""), Array.from(d1).reverse().join("")];
    return i1 === i2 && d1 === d2;
  },
  sfInt: (num: unknown) => Number.isSafeInteger(num),

  Int: (num: number, roundingMode: "ceil" | "floor" | "round" | "trunc" = "trunc") => {
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
  Inv: (num: number) => 1 / num,
  Sqr: (num: number) => num ** 2,
  Cbe: (num: number) => num ** 3,
  Rev: (num: number) => +Array.from(num.toString()).reverse().join(""),
};

export const obj = {
  entries: <E extends AnyObject>(target: E) => {
    type Key = keyof E;
    type Value = E[Key];

    const result: [keyof E, E[keyof E]][] = [];
    for (const key in target) result.push([key, target[key]]);
    return result;
  },
  fromEntries: <E extends [PropertyKey, Any][]>(entries: E) => {
    type Key = E[number][0];
    type Value = E[number][1];
    const result = {} as { [k in E[number][0]]: E[number][1] };
    for (const [key, value] of entries) result[key as Key] = value as Value;
    return result;
  },
  getProto: (target: Any) => Object.getPrototypeOf(target),
  hasOwn: (target: object, prop: PropertyKey) => Object.prototype.hasOwnProperty.call(target, prop),
  hasProp: (target: object, prop: PropertyKey) => prop in target,
  isInstance: (target: object, cls: Any) => target instanceof cls,
  isPureInstance: (target: object, cls: Any) => obj.getProto(target) === cls.prototype,
};

export const str = {
  padStart: (input: string, maxLength: number, fillString: string | null = " "): string => {
    // @ts-expect-error TypeScript is not too happy when you jump to the future (〜￣▽￣)〜
    if ("padStart" in String.prototype) return `${input}`.padStart(maxLength, fillString);

    if (!type.str(input)) {
      throw new TypeError("The `input` argument of the `str.padStart()` method must be a string.");
    }
    if (!num.sfInt(maxLength)) {
      throw new TypeError(
        "The `maxLength` argument of the `str.padStart()` method must be a safe integer.",
      );
    }
    if (fillString != null && !(fillString && type.str(fillString))) {
      throw new TypeError(
        "The `fillString` argument of the `str.padStart()` method must be a non-empty string.",
      );
    }

    if (input.length >= maxLength) return input;

    const fS = fillString ?? " ";
    const padLength = maxLength - input.length;
    return fS.repeat(Math.ceil(padLength / fS.length)).slice(0, padLength) + input;
  },
  padEnd: (input: string, maxLength: number, fillString: string | null = " ") => {
    // @ts-expect-error TypeScript is not too happy when you jump to the future (〜￣▽￣)〜
    if ("padEnd" in String.prototype) return `${input}`.padEnd(maxLength, fillString);

    if (!type.str(input)) {
      throw new TypeError("The `input` argument of the `str.padEnd()` method must be a string.");
    }
    if (!num.sfInt(maxLength)) {
      throw new TypeError(
        "The `maxLength` argument of the `str.padEnd()` method must be a safe integer.",
      );
    }
    if (fillString != null && !(fillString && type.str(fillString))) {
      throw new TypeError(
        "The `fillString` argument of the `str.padEnd()` method must be a non-empty string.",
      );
    }

    if (input.length >= maxLength) return input;

    const fS = fillString ?? " ";
    const padLength = maxLength - input.length;
    return input + fS.repeat(Math.ceil(padLength / fS.length)).slice(0, padLength);
  },
  camelCase: (input: string) => {
    if (!type.str(input)) {
      throw new TypeError("The `input` argument of the `str.camelCase()` method must be a string.");
    }

    const words = input.split(/[\s-_]/).filter(Boolean);
    return words.slice(1).reduce((res, cur) => res + cur[0].toUpperCase() + cur.slice(1), words[0]);
  },
  kebabCase: (input: string) => {
    if (!type.str(input)) {
      throw new TypeError("The `input` argument of the `str.kebabCase()` method must be a string.");
    }

    return input
      .split(/[\s-_]/)
      .filter(Boolean)
      .map((word) => word.toLowerCase())
      .join("-");
  },
  snakeCase: (input: string) => {
    if (!type.str(input)) {
      throw new TypeError("The `input` argument of the `str.snakeCase()` method must be a string.");
    }

    return input
      .split(/[\s-_]/)
      .filter(Boolean)
      .map((word) => word.toLowerCase())
      .join("_");
  },
  titleCase: (input: string) => {
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

export const type = new Proxy((data: unknown) => typeof data, {
  set: (target, prop) => false,
  get: (target, prop) => {
    if (prop === "big") return (data: unknown) => target(data) === "bigint";
    if (prop === "bin") return (data: unknown) => ArrayBuffer.isView(data);
    if (prop === "nan") return (data: unknown) => Number.isNaN(data);
    if (prop === "num") return (data: unknown) => target(data) === "number";
    if (prop === "str") return (data: unknown) => target(data) === "string";
    if (prop === "sym") return (data: unknown) => target(data) === "symbol";
    if (prop === "obj") return (data: unknown) => target(data) === "object" && data !== null;
    if (prop === "fun") return (data: unknown) => target(data) === "function";
    if (prop === "und") return (data: unknown) => target(data) === "undefined";
    if (prop === "nul") return (data: unknown) => data === null;
    if (prop === "arr") return (data: unknown) => Array.isArray(data);
    if (prop === "map") return (data: unknown) => data instanceof Map;
    if (prop === "set") return (data: unknown) => data instanceof Set;
    if (prop === "ele") return (data: unknown) => data instanceof Element;
    return null;
  },
}) as {
  (data: unknown): typeof data;
  [index: string | number | symbol]: CallableFunction | null;
  big: (data: unknown) => data is bigint;
  bin: (data: unknown) => data is ArrayBufferView;
  nan: (data: unknown) => data is number;
  num: (data: unknown) => data is number;
  str: (data: unknown) => data is string;
  sym: (data: unknown) => data is symbol;
  obj: (data: unknown) => data is AnyObject;
  fun: (data: unknown) => data is AnyFunction;
  und: (data: unknown) => data is undefined;
  nul: (data: unknown) => data is null;
  arr: (data: unknown) => data is Any[];
  map: (data: unknown) => data is Map<Any, Any>;
  set: (data: unknown) => data is Set<Any>;
  ele: (data: unknown) => data is Element;
};

export const convertToPixels = (input: string | number): number => {
  if (type.num(input) && !Number.isFinite(input)) return input;
  if (!Number.isNaN(+input)) return +input;

  const _i = `${input}`.trim().toLowerCase();
  const regex = /^([-+]?\d*.?\d+(?:e[-+]?\d+)?)\s*([a-z]*)$/i;
  const match = _i.match(regex);
  if (!match) {
    throw new TypeError(`Invalid input. The input, \`${_i}\`, did not match the testing regex.`);
  }
  const [_, _v, _u] = match;
  const v = Number.parseFloat(_v);
  const u = _u;

  if (!Number.isFinite(v)) throw new TypeError("Expected a finite unit value.");

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
      if (!type.fun(HTMLElement.prototype.computedStyleMap)) return v * 16;

      !misc.element.parentElement && document.body.appendChild(misc.element);
      misc.element.style.setProperty("font-size", `${v.toPrecision(21)}${u}`);
      return (misc.element.computedStyleMap().get("font-size") as CSSUnitValue)?.value;
    }

    default:
      throw new TypeError(`Invalid input, \`${input}\`. Unknown unit encountered.`);
  }
};

export const isHTTPSuccessStatus = (s: number) => math.bounded(s, 200, 300) && num.sfInt(s);
export const readAsDataURL = (data: BlobPart, type?: string | null): Promise<string> => {
  if (!data) throw new TypeError("BlobPart data is required.");
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(new Blob([data], type ? { type } : undefined));
  });
};
