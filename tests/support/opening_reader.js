// ============================================================
// Reads a drawn screen's opening on the fake PinballY host: the veil
// dimming the wheel while it gets ready, and lets the clock run frame by
// frame until the screen has faded in. Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";

const FRAME_MS = 16;
// Far past any opening, even with slow draws.
const MAX_OPENING_MS = 10000;

// The veil dimming the wheel: a shown layer cleared to a translucent
// colour, with nothing drawn on it. { shown: false } without one, else
// { shown: true, zIndex, color }.
export function readVeil(fake) {
    const veils = fake.drawingLayers().filter(layer => layer.alpha > 0 && layer.clearColor() !== null
        && layer.clearColor() >>> 24 > 0 && layer.strokes().length === 0 && layer.loadedImage() === null);
    assert.ok(veils.length <= 1, "a single veil at a time");
    if (veils.length === 0) return { shown: false };
    return { shown: true, zIndex: veils[0].zIndex, color: veils[0].clearColor() };
}

// The layers with this z-index that show.
export const shownLayers = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);

// Runs the clock a frame at a time until the screen whose backdrop has
// this z-index is fully in and its veil gone; fails past any opening.
export function untilFadedIn(fake, backdropZIndex) {
    const isFadedIn = () => shownLayers(fake, backdropZIndex).some(layer => layer.alpha >= 1) && !readVeil(fake).shown;
    for (let elapsed = 0; !isFadedIn(); elapsed += FRAME_MS) {
        assert.ok(elapsed < MAX_OPENING_MS, "the screen fades in");
        fake.advanceTime(FRAME_MS);
    }
}
