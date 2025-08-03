var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Colour from "./Colour.js";
import sharedData from "../shared.js";
import { arr, dom } from "../utils.js";
const isPositiveSafeInteger = (value) => {
    return Number.isSafeInteger(value) && value > -1;
};
const loadImageSource = (image, source) => {
    return new Promise((resolve, reject) => {
        const _img = image === null ? dom.create("img") : image;
        if (image === null)
            _img.crossOrigin = "anonymous";
        _img.onload = () => resolve(_img);
        _img.onerror = reject;
        _img.src = `${source}`;
    });
};
const convertToImage = (source) => __awaiter(void 0, void 0, void 0, function* () {
    const context = sharedData.context.html;
    const width = "displayWidth" in source ? source.displayWidth : source.width;
    const height = "displayHeight" in source ? source.displayHeight : source.height;
    if (width instanceof SVGAnimatedLength)
        throw new Error("Invalid input.");
    if (height instanceof SVGAnimatedLength)
        throw new Error("Invalid input.");
    const image = dom.create("img");
    context.canvas.width = image.width = width;
    context.canvas.height = image.height = height;
    context.reset();
    context.resetTransform();
    if (source instanceof ImageData)
        context.putImageData(source, 0, 0);
    else
        context.drawImage(source, 0, 0, width, height);
    return yield loadImageSource(image, context.canvas.toDataURL("image/webp", 1));
});
const getImageData = (source) => {
    if (source instanceof ImageData) {
        return new ImageData(new Uint8ClampedArray(source.data), source.width, source.height, {
            colorSpace: source.colorSpace,
        });
    }
    const context = sharedData.context.offscreen;
    const width = "displayWidth" in source ? source.displayWidth : source.width;
    const height = "displayHeight" in source ? source.displayHeight : source.height;
    if (width instanceof SVGAnimatedLength)
        throw new Error("Invalid input.");
    if (height instanceof SVGAnimatedLength)
        throw new Error("Invalid input.");
    context.canvas.width = width;
    context.canvas.height = height;
    context.reset();
    context.resetTransform();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
};
const createSolidImage = (colour = Colour.RANDOM.toHex(), size = 128) => {
    const canvas = sharedData.canvas.html;
    const context = sharedData.context.html;
    const image = dom.create("img");
    image.width = image.height = size;
    canvas.width = canvas.height = size;
    context.reset();
    context.resetTransform();
    context.lineWidth = 0;
    context.fillStyle = colour;
    context.fillRect(0, 0, size, size);
    image.src = canvas.toDataURL("image/webp", 1);
    return image;
};
const supportedInstances = [
    HTMLImageElement,
    HTMLVideoElement,
    HTMLCanvasElement,
    SVGImageElement,
    VideoFrame,
    ImageData,
    ImageBitmap,
    OffscreenCanvas,
];
class Texture {
    /**
     * Creates a Texture instance from a given source.
     *
     * @param source - The source of the texture, which can be a URL string or a supported image source type.
     * @returns A Promise that resolves to a Texture instance.
     * @throws {TypeError} If the source is not a supported image type.
     * @throws {Error} If there are issues loading the image source.
     */
    static from(source) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof source === "string")
                return new Texture(yield loadImageSource(null, source));
            if (!arr.includes(supportedInstances, Object.getPrototypeOf(source).constructor)) {
                throw new TypeError("Invalid texture source.");
            }
            if (source instanceof HTMLImageElement)
                yield loadImageSource(source, source.src);
            return new Texture(yield convertToImage(source));
        });
    }
    static get RANDOM() {
        return new Texture(createSolidImage(Colour.RANDOM.toHex()));
    }
    constructor(source) {
        this.source = source;
        this.data = getImageData(source);
    }
    get width() {
        return this.source.width;
    }
    get height() {
        return this.source.height;
    }
    getPixelAt(x, y, asObject = false) {
        const { data, width, height } = this.data;
        if (x > width || y > height)
            throw new Error("Bounds violation.");
        if (![x, y].every((v) => Number.isSafeInteger(v) && v > -1)) {
            throw new Error("Bounds violation.");
        }
        let offset = (y * width + x) * 4;
        return !asObject
            ? data.slice(offset, offset + 4)
            : {
                r: data[offset++],
                g: data[offset++],
                b: data[offset++],
                a: data[offset++],
            };
    }
    setPixelAt(x, y, data) {
        const { data: _data, width, height } = this.data;
        const values = [0, 0, 0, 255];
        if (![x, y].every((v) => Number.isSafeInteger(v) && v > -1)) {
            throw new Error("Bounds violation.");
        }
        if (x > width || y > height) {
            throw new Error(`Coordinates (${x}, ${y}) exceed texture dimensions (${width}, ${height}).`);
        }
        if ((Array.isArray(data) || ArrayBuffer.isView(data)) &&
            !(data instanceof DataView) &&
            !"BF".includes(Object.getPrototypeOf(data).constructor.name[0])) {
            if (data.length < 3)
                throw new Error("Invalid array-like length.");
            values[0] = data[0];
            values[1] = data[1];
            values[2] = data[2];
            values[3] = data[3];
        }
        else {
            const _d = data;
            if (isPositiveSafeInteger(_d.a))
                values[3] = _d.a;
            // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
            // biome-ignore lint/style/noCommaOperator: <explanation>
            if (![_d.r, _d.g, _d.b].every((v, i) => ((values[i] = v), isPositiveSafeInteger(v)))) {
                throw new Error("Invalid RGBA data object.");
            }
        }
        let offset = (y * width + x) * 4;
        _data[offset++] = values[0];
        _data[offset++] = values[1];
        _data[offset++] = values[2];
        _data[offset++] = values[3];
    }
}
Texture.WHITE = new Texture(createSolidImage("#ffffff", 16));
Texture.BLACK = new Texture(createSolidImage("#000000", 16));
Texture.RED = new Texture(createSolidImage("#ff0000", 16));
Texture.GREEN = new Texture(createSolidImage("#00ff00", 16));
Texture.BLUE = new Texture(createSolidImage("#0000ff", 16));
Texture.YELLOW = new Texture(createSolidImage("#ffff00", 16));
Texture.MAGENTA = new Texture(createSolidImage("#ff00ff", 16));
Texture.CYAN = new Texture(createSolidImage("#00ffff", 16));
Texture.TRANSPARENT = new Texture(createSolidImage("#00000000", 16));
export default Texture;
