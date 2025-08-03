import type { Any, IText } from "../types.ts";
import { arr, type } from "../utils.js";
import Colour from "./Colour.js";
import Renderable, { validateOpts } from "./Renderable.ts";

const validateTextOpts = {
  ...validateOpts,
  text: (value: Any): string => {
    if (!type.str(value)) throw new TypeError("Invalid text. Text must be a string.");
    return value;
  },
  fontSize: (value: Any): number => validateOpts.Length(value, "fontSize"),
  fontFamily: (value: Any): string => {
    if (!type.str(value)) throw new TypeError("Invalid font family. Font family must be a string.");
    return value;
  },
  textColour: (value: Any): Colour => validateOpts.Colour(value, "textColour"),
  textAlign: (value: Any): CanvasTextAlign => {
    if (!type.str(value) || !arr.includes(["left", "right", "center", "start", "end"],value)) {
      throw new TypeError("Invalid textAlign. Must be 'left', 'right', 'center', 'start', or 'end'.");
    }
    return value as CanvasTextAlign;
  },
  textBaseline: (value: Any): CanvasTextBaseline => {
    if (!type.str(value) || !arr.includes(["top", "hanging", "middle", "alphabetic", "ideographic", "bottom"], value)) {
      throw new TypeError("Invalid textBaseline. Must be one of the valid CanvasTextBaseline values.");
    }
    return value as CanvasTextBaseline;
  }
};

const assignOpts = (text: Text, options: IText.Config) => {
  const { text: textContent, fontSize, fontFamily, textColour, textAlign, textBaseline } = options;

  if (textContent != null) text.text = validateTextOpts.text(textContent);
  if (fontSize != null) text.fontSize = validateTextOpts.fontSize(fontSize);
  if (fontFamily != null) text.fontFamily = validateTextOpts.fontFamily(fontFamily);
  if (textColour != null) text.textColour = validateTextOpts.textColour(textColour);
  if (textAlign != null) text.textAlign = validateTextOpts.textAlign(textAlign);
  if (textBaseline != null) text.textBaseline = validateTextOpts.textBaseline(textBaseline);
};

class Text extends Renderable implements IText.Instance {
  text = "";
  fontSize = 16;
  fontFamily = "serif";
  textColour: Colour = Colour.BLACK;
  textAlign: CanvasTextAlign = "left";
  textBaseline: CanvasTextBaseline = "alphabetic";

  constructor(options: IText.Config) {
    super(options);
    assignOpts(this, options)
  }
}

export default Text;
