// ============================================================
// Reads the launch text on the fake PinballY host's playfield layers: the
// words drawn by the layers other than the Loader's, their colour, their
// black outline (the copies drawn round them), and the layer's z-index,
// scale and position. Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";

const OUTLINE_COLOR = 0xFF000000;

// null without a launch text on screen, else { text, color, outline,
// lines, zIndex, scale, position }; outline: the eight directions the
// black copies are offset by, as "dx,dy" signs.
export function readLaunchText(fake) {
    const layers = fake.drawingLayers().filter(layer => layer.alpha > 0 && layer.strokes().some(stroke => "text" in stroke));
    assert.ok(layers.length <= 1, "a single launch text at a time");
    if (layers.length === 0) return null;
    const [layer] = layers;
    const texts = layer.strokes().filter(stroke => "text" in stroke);
    const word = texts[texts.length - 1];
    const copies = texts.slice(0, -1);
    assert.ok(copies.every(copy => copy.text === word.text && copy.color === OUTLINE_COLOR), "the copies are the same words in black");
    const outline = copies
        .map(copy => `${Math.sign(copy.rect.x - word.rect.x)},${Math.sign(copy.rect.y - word.rect.y)}`)
        .sort();
    return {
        text: word.text,
        color: word.color,
        outline,
        lines: word.text.split("\n").length,
        zIndex: layer.zIndex,
        scale: layer.scale(),
        position: layer.position(),
    };
}

// The eight directions round the words, as readLaunchText() lists them.
export const EIGHT_DIRECTIONS = ["-1,-1", "-1,0", "-1,1", "0,-1", "0,1", "1,-1", "1,0", "1,1"];
