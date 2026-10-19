// ============================================================
// Loader: the small gold comet turning in the middle of the playfield while
// the player waits, or on the top third over the High Score Board.
// show() and hide() are safe to call again. Takes no button.
// - The APNG plays by itself; hide() removes the layer, so an idle Loader costs nothing.
// ============================================================

import { LOADER_IMAGE } from "./loader_image.js";

// 7 % of the window's height, by height only: PinballY keeps the image's
// proportions without the window being measured, which is not laid out
// yet at startup.
export const LOADER_HEIGHT = 0.07;
const LOADER_SCALE = Object.freeze({ ySpan: LOADER_HEIGHT });
// Where the comet turns, chosen at creation: the centre of the playfield
// screen, or the centre of its top third (PinballY's y axis points up, in
// window heights); another height can be given, such as the launch's
// placement above its text.
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
