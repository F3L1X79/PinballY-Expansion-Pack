// ============================================================
// Reads the Loader on the fake PinballY host's playfield layers: the layer
// showing the comet image, whether it shows, its z-index, scale and
// position. Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";
import { LOADER_IMAGE } from "../../common/drawing/loader_image.js";

const isLoaderLayer = layer => {
    const image = layer.loadedImage();
    return image !== null && image.endsWith(`\\${LOADER_IMAGE.folder}\\${LOADER_IMAGE.file}`);
};

// The Loader layers, shown or not.
export const loaderLayerCount = fake => fake.drawingLayers().filter(isLoaderLayer).length;

// { shown: false } without a Loader on screen, else { shown: true, zIndex,
// scale, position }.
export function readLoader(fake) {
    const shown = fake.drawingLayers().filter(layer => isLoaderLayer(layer) && layer.alpha > 0);
    assert.ok(shown.length <= 1, "a single Loader at a time");
    if (shown.length === 0) return { shown: false };
    const [layer] = shown;
    return { shown: true, zIndex: layer.zIndex, scale: layer.scale(), position: layer.position() };
}
