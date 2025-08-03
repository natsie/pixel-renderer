import Renderable, { validateOpts } from "./Renderable.ts";
import type { IRenderer, ISprite } from "../types.ts";
import Texture from "./Texture.ts";

const assignOpts = (sprite: Sprite, options: ISprite.Config) => {
  const { size, texture, textureOffset, textureScale } = options;

  if (size != null) sprite.size = validateOpts.size(size);
  if (texture != null) sprite.texture = validateOpts.texture(texture);
  if (textureOffset != null) sprite.textureOffset = validateOpts.textureOffset(textureOffset);
  if (textureScale != null) sprite.textureScale = validateOpts.textureScale(textureScale);

  if (size == null) sprite.size = { width: sprite.texture.width, height: sprite.texture.height };
};

class Sprite extends Renderable implements ISprite.Instance {
  size: IRenderer.Size = { width: 0, height: 0 }
  texture: Texture = Texture.TRANSPARENT;
  textureOffset: IRenderer.Vector = [0, 0];
  textureScale: IRenderer.Vector = [1, 1];

  constructor(options: ISprite.Config) {
    super(options);
    assignOpts(this, options);
  }
}

export default Sprite;
