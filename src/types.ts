import type Colour from "./components/Colour.ts";
import type Texture from "./components/Texture.ts";
import type $Renderable from "./components/Renderable.ts";
import type $Sprite from "./components/Sprite.ts";
import type $Text from "./components/Text.ts";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type Any = any;
export type AnyObject = { [index: string]: Any };
export type AnyFunction = (...args: Any[]) => Any;

export type Bytes = Uint8Array;
export type DeepPartial<v extends object> = {
  [k in keyof v]?: (v[k] extends object ? DeepPartial<v[k]> : v[k]) | undefined;
};
export type FlatArray<Arr, Depth extends number> = {
  done: Arr;
  recur: Arr extends ReadonlyArray<infer InnerArr>
    ? FlatArray<
        InnerArr,
        [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][Depth]
      >
    : Arr;
}[Depth extends -1 ? "done" : "recur"];

export namespace IPixel {
  export type Config = Partial<Options>;
  export interface Options {
    width: number;
    height: number;
    canvas: HTMLCanvasElement | OffscreenCanvas;
    backgroundColour: string | number | IColour.Instance;
  }

  export interface Data {
    width: number;
    height: number;
    canvas: IRenderer.Canvas;
    context: IRenderer.Context;
    backgroundColour: Colour;
  }

  export interface Screen {
    canvas: IRenderer.Canvas;
    context: IRenderer.Context;
    width: number;
    height: number;
  }

  export interface Instance {
    data: Data;
    screen: Screen;
    renderables: Set<IRenderable.Instance>;

    add(...renderables: (IRenderer.Renderable | IRenderer.Renderable[])[]): Instance;
    remove(renderable: IRenderer.Renderable): boolean;
    render(): null;
  }
}

export namespace IColour {
  export type Format = RGBFormat | HSLFormat | HWBFormat;
  export type Source = string | number | Bytes | IColour.Format;

  export interface RGBFormat {
    r: number;
    g: number;
    b: number;
    a?: number | null;
  }

  export interface HSLFormat {
    h: number;
    s: number;
    l: number;
    a?: number | null;
  }

  export interface HWBFormat {
    h: number;
    w: number;
    b: number;
    a?: number | null;
  }

  export interface Data {
    r: number;
    g: number;
    b: number;
    h: number;
    s: number;
    l: number;
    a: number;
  }

  export interface Instance extends Data {
    toHex(): string;
    toHsl(): string;
    toHwb(): string;
    toInt(): number;
    toRgb(): string;
    toBytes(): Bytes;
    toNumber(): number;
    toString(): string;
    toInverse(): Instance;
  }
}

export namespace IRenderer {
  export type Canvas = HTMLCanvasElement | OffscreenCanvas;
  export type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  export type Position = { x: number; y: number; z: number };
  export type Renderable = $Renderable | $Sprite | $Text;
  export type Size = { width: number; height: number };
  export type Vector = [number, number];
  export type StringNumberVector = [string | number, string | number];
  export interface RenderState {
    canvas: Canvas;
    context: Context;
    rendered: Set<IRenderable.Instance>;
    stack: IRenderable.Instance[];
  }
}

export namespace ITexture {
  export type Source = CanvasImageSource | ImageData;
  export type RGBAData = { r: number; g: number; b: number; a?: number | null };
  export type SafeIntegerArray =
    | Array<number>
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array;

  export interface Instance {
    source: HTMLImageElement;
    data: ImageData;

    width: number;
    height: number;
  }
}

export namespace IRenderable {
  export type Config = DeepPartial<Options>;

  export interface StyleMap {
    "background-colour": IColour.Instance;
    "background-image": ITexture.Instance;
    "background-position": IRenderer.StringNumberVector;
    "background-size": IRenderer.StringNumberVector;
    "font-family": string;
    "font-size": string | number;
    "font-weight": number;
    "foreground-colour": IColour.Instance;
    "text-align": "start" | "end" | "centre";
    transform: {
      origin: IRenderer.StringNumberVector;
      rotate: [(string | number)?, (string | number)?, (string | number)?];
      scale: IRenderer.Vector;
      translate: IRenderer.StringNumberVector;
    };
  }

  export interface PartialStyleMap {
    "background-colour"?: IColour.Instance | null;
    "background-image"?: ITexture.Instance | null;
    "background-position"?: IRenderer.StringNumberVector | null;
    "background-size"?: IRenderer.StringNumberVector | null;
    "font-family"?: string | null;
    "font-size"?: string | number | null;
    "font-weight"?: number | null;
    "foreground-colour"?: IColour.Instance | null;
    "text-align"?: "start" | "end" | "centre" | null;
    transform?: {
      origin?: IRenderer.StringNumberVector | null;
      rotate?:
        | [(string | number | null)?, (string | number | null)?, (string | number | null)?]
        | null;
      scale?: IRenderer.Vector | null;
      translate?: IRenderer.StringNumberVector | null;
    } | null;
  }

  export interface Options {
    anchor: IRenderer.Vector;
    position: IRenderer.Position;

    angle: number;
    rotation: number;
    opacity: number;
    scale: IRenderer.Vector;

    style: IRenderable.PartialStyleMap;
    shouldRender: boolean;
  }

  export interface Instance {
    shouldRender: boolean;
    style: IRenderable.PartialStyleMap;
    angle: number;
    rotation: number;
    opacity: number;
    scale: IRenderer.Vector;
    anchor: IRenderer.Vector;
    position: IRenderer.Position;
  }
}

export namespace ISprite {
  export type Config = DeepPartial<Options>;

  export interface Options extends IRenderable.Options {
    size: IRenderer.Size;
    texture: Texture;
    textureOffset: IRenderer.Vector;
    textureScale: IRenderer.Vector;
  }

  export interface Instance extends IRenderable.Instance {
    texture: Texture;
    textureOffset: IRenderer.Vector;
    textureScale: IRenderer.Vector;
  }
}

export namespace IText {
  export type Config = DeepPartial<Options>;

  export interface Options extends IRenderable.Options {
    text: string;
    fontSize: number | string;
    fontFamily: string;
    textColour: string | number | IColour.Instance;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
  }

  export interface Instance extends IRenderable.Instance {
    text: string;
    fontSize: number;
    fontFamily: string;
    textColour: Colour;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
  }
}
