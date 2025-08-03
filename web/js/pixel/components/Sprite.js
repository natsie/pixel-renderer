import Renderable, { validateOpts } from "./Renderable.js";
import Texture from "./Texture.js";
const assignOpts = (sprite, options) => {
    const { size, texture, textureOffset, textureScale } = options;
    if (size != null)
        sprite.size = validateOpts.size(size);
    if (texture != null)
        sprite.texture = validateOpts.texture(texture);
    if (textureOffset != null)
        sprite.textureOffset = validateOpts.textureOffset(textureOffset);
    if (textureScale != null)
        sprite.textureScale = validateOpts.textureScale(textureScale);
    if (size == null)
        sprite.size = { width: sprite.texture.width, height: sprite.texture.height };
};
class Sprite extends Renderable {
    constructor(options) {
        super(options);
        this.size = { width: 0, height: 0 };
        this.texture = Texture.TRANSPARENT;
        this.textureOffset = [0, 0];
        this.textureScale = [1, 1];
        assignOpts(this, options);
    }
}
export default Sprite;
