import sharedData from "./shared.js";
import Colour from "./components/Colour.js";
import { arr, obj, math, type, convertToPixels } from "./utils.js";
import Renderable, { validateOpts } from "./components/Renderable.js";
import Sprite from "./components/Sprite.js";
import Text from "./components/Text.js";
import Texture from "./components/Texture.js";
const assignOpts = (target, options) => {
    const { width, height, canvas, backgroundColour } = options;
    const _v = validateOpts;
    if (width != null)
        target.width = _v.PositiveNumber(_v.IntegerNumber(width, "width"), "width", false);
    if (height != null)
        target.height = _v.PositiveNumber(_v.IntegerNumber(height, "height"), "height", false);
    if (canvas != null)
        target.canvas = _v.Canvas(canvas, "canvas");
    if (backgroundColour != null)
        target.backgroundColour = _v.Colour(backgroundColour, "backgroundColour");
    const context = target.canvas.getContext("2d");
    if (context === null)
        throw new ReferenceError("Failed to acquire rendering context.");
    target.context = context;
    target.canvas.width = target.width;
    target.canvas.height = target.height;
};
const renderFunctions = new Map([
    [
        Sprite,
        (state) => {
            var _a;
            const { context, stack } = state;
            const sprite = stack.pop();
            if (!sprite)
                return null;
            try {
                context.save();
                const style = sprite.style;
                const anchorX = sprite.anchor[0] * sprite.size.width * sprite.scale[0];
                const anchorY = sprite.anchor[1] * sprite.size.height * sprite.scale[1];
                const sWidth = sprite.size.width * sprite.scale[0];
                const sHeight = sprite.size.height * sprite.scale[1];
                const xTexture = sprite.textureOffset[0] * sprite.texture.width;
                const yTexture = sprite.textureOffset[1] * sprite.texture.height;
                const tWidth = (sprite.texture.width - xTexture) / sprite.textureScale[0];
                const tHeight = (sprite.texture.height - yTexture) / sprite.textureScale[1];
                const transltn = [sprite.position.x, sprite.position.y];
                const calcCache = [
                    -anchorX, // draw position x
                    -anchorY, // draw position y
                    sWidth / 2, // half draw-width
                    sHeight / 2, // half draw-height
                    -anchorX + sWidth / 2, // draw center x
                    -anchorY + sHeight / 2, // draw center y
                    2 * Math.PI, // 360 degrees in radians
                    Colour.YELLOW.toHex(), // debug draw colour
                ];
                context.globalAlpha *= math.clamp(sprite.opacity, 0, 1);
                context.translate(transltn[0], transltn[1]);
                context.rotate(sprite.rotation);
                {
                    const _bgSize = [...(style["background-size"] || [1, 1])];
                    const _bgPos = [
                        ...(style["background-position"] || [0, 0]),
                    ];
                    const bgImg = style["background-image"] || Texture.TRANSPARENT;
                    const bgSize = [
                        type.num(_bgSize[0]) ? _bgSize[0] * sWidth : convertToPixels(_bgSize[0]),
                        type.num(_bgSize[1]) ? _bgSize[1] * sHeight : convertToPixels(_bgSize[1]),
                    ];
                    const bgPos = [
                        type.num(_bgPos[0]) ? _bgPos[0] * sWidth : convertToPixels(_bgPos[0]),
                        type.num(_bgPos[1]) ? _bgPos[1] * sHeight : convertToPixels(_bgPos[1]),
                    ];
                    const bgBounds = [
                        [-anchorX + bgPos[0], -anchorY + bgPos[1]],
                        [-anchorX + bgPos[0] + bgSize[0], -anchorY + bgPos[1] + bgSize[1]],
                    ];
                    bgBounds[0][0] = math.clamp(bgBounds[0][0], -anchorX, -anchorX + sWidth);
                    bgBounds[1][0] = math.clamp(bgBounds[1][0], -anchorX, -anchorX + sWidth);
                    bgBounds[0][1] = math.clamp(bgBounds[0][1], -anchorY, -anchorY + sHeight);
                    bgBounds[1][1] = math.clamp(bgBounds[1][1], -anchorY, -anchorY + sHeight);
                    context.fillStyle = ((_a = style["background-colour"]) === null || _a === void 0 ? void 0 : _a.toHex()) || "#00000000";
                    context.fillRect(...bgBounds[0], bgBounds[1][0] - bgBounds[0][0], bgBounds[1][1] - bgBounds[0][1]);
                    context.drawImage(bgImg.source, ...bgBounds[0], bgBounds[1][0] - bgBounds[0][0], bgBounds[1][1] - bgBounds[0][1]);
                }
                context.drawImage(sprite.texture.source, xTexture, yTexture, tWidth, tHeight, -anchorX, -anchorY, sWidth, sHeight);
                if (PixelRenderer.DEBUG_MODE) {
                    context.globalAlpha = 1;
                    context.fillStyle = context.strokeStyle = Colour.YELLOW.toHex();
                    context.strokeRect(-anchorX, -anchorY, sWidth, sHeight);
                    context.fillRect(-anchorX, calcCache[5] - 0.5, sWidth, 1);
                    context.fillRect(calcCache[4] - 0.5, -anchorY, 1, sHeight);
                    context.beginPath();
                    context.arc(calcCache[4], calcCache[5], sWidth / 2, 0, calcCache[6], false);
                    context.arc(calcCache[4], calcCache[5], sHeight / 2, 0, calcCache[6], false);
                    context.stroke();
                    context.closePath();
                    context.fillStyle = context.strokeStyle = Colour.RED.toHex();
                    context.fillRect(calcCache[4] - 0.5, calcCache[5] - 0.5, 1, 1);
                }
                context.rotate(-sprite.rotation);
                context.translate(-transltn[0], -transltn[1]);
            }
            finally {
                context.restore();
            }
            return null;
        },
    ],
    [
        Text,
        (state) => {
            const { context, stack } = state;
            const $text = stack.pop();
            if (!$text)
                return null;
            try {
                context.save();
                context.font = `${$text.fontSize}px ${$text.fontFamily}`;
                context.textAlign = $text.textAlign;
                context.textBaseline = $text.textBaseline;
                context.fillStyle = $text.textColour.toHex();
                const tm = context.measureText($text.text);
                // console.log(tm);
                const anchorX = $text.anchor[0] * tm.width;
                const anchorY = $text.anchor[1] *
                    -(tm.fontBoundingBoxAscent +
                        tm.fontBoundingBoxDescent -
                        (tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent));
                const transltn = [$text.position.x, $text.position.y];
                context.translate(transltn[0], transltn[1]);
                context.scale($text.scale[0], $text.scale[1]);
                context.fillText($text.text, -anchorX, -anchorY);
            }
            finally {
                context.restore();
            }
            return null;
        },
    ],
]);
const pixelDefaultData = {
    width: 640,
    height: 360,
    canvas: globalThis.document ? sharedData.canvas.offscreen : sharedData.canvas.html,
    context: globalThis.document ? sharedData.context.offscreen : sharedData.context.html,
    backgroundColour: Colour.from("rebeccapurple"),
};
class PixelRenderer {
    constructor(options = {}) {
        this.data = Object.assign({}, pixelDefaultData);
        this.screen = {
            canvas: sharedData.canvas.offscreen,
            context: sharedData.context.offscreen,
            width: 1,
            height: 1,
        };
        this.renderables = new Set();
        assignOpts(this.data, options);
        Object.defineProperties(this.screen, {
            canvas: { get: () => this.data.canvas },
            context: { get: () => this.data.context },
            width: {
                get: () => this.screen.canvas.width,
                // biome-ignore lint/suspicious/noAssignInExpressions:
                set: (value) => (this.screen.canvas.width = value),
            },
            height: {
                get: () => this.screen.canvas.height,
                // biome-ignore lint/suspicious/noAssignInExpressions:
                set: (value) => (this.screen.canvas.height = value),
            },
        });
    }
    add(...renderables) {
        const _r = arr.flat(renderables, 1);
        if (!_r.every((r) => r instanceof Renderable))
            throw new TypeError("Invalid renderable.");
        for (let i = 0; i < _r.length; i++)
            this.renderables.add(_r[i]);
        return this;
    }
    remove(renderable) {
        return this.renderables.delete(renderable);
    }
    render() {
        var _a;
        const { data, renderables, screen: { canvas, context }, } = this;
        const state = {
            canvas,
            context,
            rendered: new Set(),
            stack: Array.from(renderables).reverse(),
        };
        context.reset();
        context.lineWidth = 0;
        context.fillStyle = data.backgroundColour.toHex();
        context.fillRect(0, 0, canvas.width, canvas.height);
        while (state.stack.length > 0) {
            const rO = state.stack[state.stack.length - 1];
            const rfunc = renderFunctions.get((_a = obj.getProto(rO)) === null || _a === void 0 ? void 0 : _a.constructor);
            if (!rfunc) {
                console.warn(`No render function found for ${rO.constructor.name}.`);
                state.stack.pop();
                continue;
            }
            rfunc.call(null, state);
        }
        return null;
    }
}
PixelRenderer.DEBUG_MODE = false;
export default null;
export { PixelRenderer };
export { default as Colour } from "./components/Colour.js";
export { default as Renderable } from "./components/Renderable.js";
export { default as Sprite } from "./components/Sprite.js";
export { default as Text } from "./components/Text.js";
export { default as Texture } from "./components/Texture.js";
export { default as Ticker } from "./components/Ticker.js";
