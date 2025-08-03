const canvas = {
  html: document.createElement("canvas"),
  offscreen: new OffscreenCanvas(1, 1),
};

const context = {
  html: canvas.html.getContext("2d") as CanvasRenderingContext2D,
  offscreen: canvas.offscreen.getContext("2d") as OffscreenCanvasRenderingContext2D,
};

context.html.imageSmoothingEnabled = true
context.html.imageSmoothingQuality = "high"
context.offscreen.imageSmoothingEnabled = true
context.offscreen.imageSmoothingQuality = "high"

if (context.html === null) throw new ReferenceError("Failed to acquire CanvasRenderingContext2D.");
if (context.offscreen === null) {
  throw new ReferenceError("Failed to acquire OffscreenCanvasRenderingContext2D.");
}

export default {
  canvas,
  context,
};
