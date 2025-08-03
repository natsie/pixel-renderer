import { PixelRenderer, Colour, Sprite, Text, Texture } from "./pixel/pixel.js";
import WebGPUTest from "./webgpu-test.js";

const main = document.querySelector("main");
const canvas = document.querySelector("canvas");

async function run() {
  const pixel = new PixelRenderer({
    canvas,
    width: 640,
    height: 360,
    backgroundColour: Colour.from("rebeccapurple"),
  });

  const sprite = new Sprite({
    position: { x: pixel.screen.width / 2, y: pixel.screen.height / 2 },
    anchor: [0.5, 0.5],
    angle: 0,
    scale: [1.5, 1.2],
    size: { width: 150, height: 150 },
    textureOffset: [0, 0],
    textureScale: [1, 1],
    texture: await Texture.from("/web/assets/images/spear.png"),

    style: {
      "background-colour": Colour.from("#ff808080"),
      "background-position": [0, 0],
      "background-size": [0, 0],
    },
  });
  const text = new Text({
    position: { x: pixel.screen.width / 2, y: pixel.screen.height / 2 },
    anchor: [0.5, 0.5],
    angle: 0,
    scale: [1, 1],

    text: "Hello world!",
    fontSize: 64,
    fontFamily: "monospace",
    textColour: Colour.CYAN,

    style: Object.getPrototypeOf(Text.prototype).constructor.defaultStyleMap,
  });

  let direction = 0;
  function render() {
    function anim() {
      const { style } = sprite;
      const bgSize = style["background-size"];
      const bgPos = style["background-position"];

      sprite.angle = ++sprite.angle % 360;

      if (direction === 0) {
        bgPos[0] = 0;
        bgPos[1] = 0;
        bgSize[0] += (1 - 0.01) / ((bgSize[0] < 0.25 ? 60 : bgSize[0] > 0.75 ? 80 : 45) / 1.5);
        bgSize[1] += (1 - 0.01) / ((bgSize[1] < 0.25 ? 60 : bgSize[1] > 0.75 ? 80 : 45) / 1.5);

        if (bgSize[0] > 1 && bgSize[1] > 1) {
          direction = 1;
          [bgSize[0], bgSize[1]] = [1, 1];
        }
      }

      if (direction === 1) {
        bgSize[0] -= 0.01;
        bgSize[1] -= 0.01;
        bgPos[0] = 1 - bgSize[0];
        bgPos[1] = 1 - bgSize[1];

        if (bgSize[0] < 0 && bgSize[1] < 0) {
          direction = 2;
          [bgSize[0], bgSize[1]] = [0, 0];
        }
      }

      if (direction === 2) {
        bgSize[0] += 0.01;
        bgSize[1] += 0.01;
        bgPos[0] = 1 - bgSize[0];
        bgPos[1] = 1 - bgSize[1];

        if (bgSize[0] > 1 && bgSize[1] > 1) {
          direction = 3;
          [bgSize[0], bgSize[1]] = [1, 1];
        }
      }

      if (direction === 3) {
        bgSize[0] -= 0.01;
        bgSize[1] -= 0.01;
        bgPos[0] = 0;
        bgPos[1] = 0;

        if (bgSize[0] < 0 && bgSize[1] < 0) {
          direction = 0;
          [bgSize[0], bgSize[1]] = [0, 0];
        }
      }
    }

    pixel.render();
    anim();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
  console.log(pixel.add([sprite, text]));
}
main.append(
  Texture.WHITE.source,
  Texture.BLACK.source,
  Texture.RED.source,
  Texture.GREEN.source,
  Texture.BLUE.source,
  Texture.YELLOW.source,
  Texture.CYAN.source,
  Texture.MAGENTA.source,
);

PixelRenderer.DEBUG_MODE = true;
run();
