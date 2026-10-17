// ============================================================
// Loader: the small gold comet that turns in the middle of the playfield
// screen while the player waits for something to get ready, or on its top
// third over the High Score Board already shown, never hiding the scores.
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
// Where the comet turns, chosen at creation: the centre of the playfield
// screen, or the centre of its top third (PinballY's y axis points up, in
// window heights).
export const LOADER_PLACEMENT = Object.freeze({ CENTRED: 0, TOP_THIRD: 1 / 6 });

export function createLoader(host, { zIndex, placement = LOADER_PLACEMENT.CENTRED }) {
    const imagePath = `${host.getProjectFolder()}\\${LOADER_IMAGE.folder}\\${LOADER_IMAGE.file}`;
    let layer = null;

    return {
        show() {
            if (layer) return;
            layer = host.createDrawingLayer(zIndex);
            layer.loadImage(imagePath);
            layer.setScale(LOADER_SCALE);
            layer.setPos(0, placement);
        },
        hide() {
            if (!layer) return;
            host.removeDrawingLayer(layer);
            layer = null;
        },
    };
}
