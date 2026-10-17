// ============================================================
// Loader: the small gold comet that turns on the top third of the
// playfield screen while the player waits for something to get ready.
// show() creates one drawing layer at the Loader's z-index and loads the
// comet's APNG into it, which PinballY plays by itself with no script per
// frame; hide() removes the layer, so an idle Loader costs nothing per
// frame. Both are safe to call again. Takes no button.
// ============================================================

import { LOADER_IMAGE } from "./loader_image.js";

// 7 % of the window's height, by height only: PinballY keeps the image's
// proportions without the window being measured, which is not laid out
// yet at startup.
const LOADER_SCALE = Object.freeze({ ySpan: 0.07 });
// Centred on the top third (PinballY's y axis points up, in window heights).
const LOADER_Y = 1 / 6;

export function createLoader(host, { zIndex }) {
    const imagePath = `${host.getProjectFolder()}\\${LOADER_IMAGE.folder}\\${LOADER_IMAGE.file}`;
    let layer = null;

    return {
        show() {
            if (layer) return;
            layer = host.createDrawingLayer(zIndex);
            layer.loadImage(imagePath);
            layer.setScale(LOADER_SCALE);
            layer.setPos(0, LOADER_Y);
        },
        hide() {
            if (!layer) return;
            host.removeDrawingLayer(layer);
            layer = null;
        },
    };
}
