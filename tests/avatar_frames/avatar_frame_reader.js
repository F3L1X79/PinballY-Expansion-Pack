// ============================================================
// Reads the Avatar Frame a layer draws around an Avatar: the frame's id
// and image size (from the image's file name), or none, and whether the
// Player Level pip is drawn after it. Never loaded by PinballY.
// ============================================================

import { pipColor } from "../levels/level_pip_reader.js";

const FRAME_IMAGE = /\\avatar_frames\\frame_(\d+|[a-zA-Z]+)_(192|384)(_locked)?\.png$/;

export const isFrameImage = path => FRAME_IMAGE.test(path);

const frameStrokes = layer => layer.strokes().filter(stroke => "image" in stroke && isFrameImage(stroke.image));

// { tier (the frame's id: a Collection Tier, or a Holiday Frame's text
// id), size (192 or 384), rect (where it is drawn) }, null when the layer
// is hidden or draws no frame.
export function shownFrame(layer) {
    if (!layer || layer.alpha === 0) return null;
    const strokes = frameStrokes(layer);
    if (strokes.length === 0) return null;
    const [, id, size] = FRAME_IMAGE.exec(strokes[0].image);
    return { tier: /^\d+$/.test(id) ? Number(id) : id, size: Number(size), rect: strokes[0].rect };
}

// Whether every fill of the layer's pip comes after its frame image.
export function isPipOverFrame(layer) {
    const strokes = layer.strokes();
    const frameAt = strokes.findIndex(stroke => "image" in stroke && FRAME_IMAGE.test(stroke.image));
    const color = pipColor(layer);
    const firstPipAt = strokes.findIndex(stroke => stroke.fill === color);
    return frameAt >= 0 && color !== null && firstPipAt > frameAt;
}
