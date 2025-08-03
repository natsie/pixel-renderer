import { arr, type } from "../utils.js";
import Colour from "./Colour.js";
import Renderable, { validateOpts } from "./Renderable.js";
const validateTextOpts = Object.assign(Object.assign({}, validateOpts), { text: (value) => {
        if (!type.str(value))
            throw new TypeError("Invalid text. Text must be a string.");
        return value;
    }, fontSize: (value) => validateOpts.Length(value, "fontSize"), fontFamily: (value) => {
        if (!type.str(value))
            throw new TypeError("Invalid font family. Font family must be a string.");
        return value;
    }, textColour: (value) => validateOpts.Colour(value, "textColour"), textAlign: (value) => {
        if (!type.str(value) || !arr.includes(["left", "right", "center", "start", "end"], value)) {
            throw new TypeError("Invalid textAlign. Must be 'left', 'right', 'center', 'start', or 'end'.");
        }
        return value;
    }, textBaseline: (value) => {
        if (!type.str(value) || !arr.includes(["top", "hanging", "middle", "alphabetic", "ideographic", "bottom"], value)) {
            throw new TypeError("Invalid textBaseline. Must be one of the valid CanvasTextBaseline values.");
        }
        return value;
    } });
const assignOpts = (text, options) => {
    const { text: textContent, fontSize, fontFamily, textColour, textAlign, textBaseline } = options;
    if (textContent != null)
        text.text = validateTextOpts.text(textContent);
    if (fontSize != null)
        text.fontSize = validateTextOpts.fontSize(fontSize);
    if (fontFamily != null)
        text.fontFamily = validateTextOpts.fontFamily(fontFamily);
    if (textColour != null)
        text.textColour = validateTextOpts.textColour(textColour);
    if (textAlign != null)
        text.textAlign = validateTextOpts.textAlign(textAlign);
    if (textBaseline != null)
        text.textBaseline = validateTextOpts.textBaseline(textBaseline);
};
class Text extends Renderable {
    constructor(options) {
        super(options);
        this.text = "";
        this.fontSize = 16;
        this.fontFamily = "serif";
        this.textColour = Colour.BLACK;
        this.textAlign = "left";
        this.textBaseline = "alphabetic";
        assignOpts(this, options);
    }
}
export default Text;
