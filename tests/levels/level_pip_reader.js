// ============================================================
// Reads the Player Level pip a layer shows: its number (the digits drawn
// over the level's metal) and its width. Never loaded by PinballY.
// ============================================================

import { playerLevelColorOf } from "../../common/steamball_drawing.js";

// The fills in the metal of the level the layer's digits show.
function pipFills(layer) {
    const digits = layer.strokes().filter(stroke => "text" in stroke && /^\d+$/.test(stroke.text));
    if (digits.length !== 1) return [];
    const color = playerLevelColorOf(Number(digits[0].text));
    return layer.strokes().filter(stroke => stroke.fill === color);
}

// The colour the layer's pip is drawn in, null when it shows no pip.
export function pipColor(layer) {
    const fills = pipFills(layer);
    return fills.length === 0 ? null : fills[0].fill;
}

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
