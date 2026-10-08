// ============================================================
// Reads the Player Level pip a layer shows: its number (the digits drawn
// over the Player Level colour) and its width. Never loaded by PinballY.
// ============================================================

import { STEAMBALL_COLORS } from "../common/steamball_palette.js";

const pipFills = layer => layer.strokes().filter(stroke => stroke.fill === STEAMBALL_COLORS.playerLevel);

// The pip's number, null when the layer is hidden or shows no pip.
export function shownPip(layer) {
    if (!layer || layer.alpha === 0 || pipFills(layer).length === 0) return null;
    const digits = layer.strokes().filter(stroke => "text" in stroke && /^\d+$/.test(stroke.text));
    return digits.length === 1 ? digits[0].text : null;
}

// How wide the pip is drawn, in canvas pixels.
export function pipWidth(layer) {
    const rects = pipFills(layer).map(stroke => stroke.rect);
    return Math.max(...rects.map(rect => rect.x + rect.width)) - Math.min(...rects.map(rect => rect.x));
}
