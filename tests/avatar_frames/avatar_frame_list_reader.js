// ============================================================
// Reads the Avatar Frame list's Exit Button and Button Hints as the player
// sees them, on the fake host: the highlighted choice, the footer's groups,
// and where footer and rows sit. Never loaded by PinballY.
// ============================================================

import { AVATAR_FRAME_LIST_Z_INDEX } from "../../common/avatar_frames/avatar_frame_list_painter.js";
import * as selectionMarker from "../support/selection_marker_reader.js";
import { shownLayers } from "../support/shown_layers.js";
import { buttonHintsOn, exitButtonTooltipOn } from "../support/button_hints_reader.js";
import { highlightedRow } from "../stats/profile_stats_reader.js";

export const isMarkerOnExitButton = fake =>
    selectionMarker.layerUnderMarker(fake, AVATAR_FRAME_LIST_Z_INDEX.marker, shownLayers(fake, AVATAR_FRAME_LIST_Z_INDEX.exitButton)) !== undefined;

// The Exit Button's tooltip while it is selected, otherwise the
// highlighted row's name.
export const highlightedChoice = fake => exitButtonTooltipOn(fake, AVATAR_FRAME_LIST_Z_INDEX.tooltip) || highlightedRow(fake);

// The footer's groups of key caps and words, null when it does not show.
export const frameListButtonHints = fake => buttonHintsOn(fake, AVATAR_FRAME_LIST_Z_INDEX.buttonHints);

// Where a layer shows in a window of that size: PinballY centres it on its
// position and scales it to ySpan of the window's height, its canvas's
// aspect kept.
function windowRect(layer, { width, height }) {
    const canvas = layer.canvasSize();
    const h = layer.scale().ySpan * height;
    const w = h * canvas.width / canvas.height;
    const cx = (layer.position().x + 0.5) * width;
    const cy = (0.5 - layer.position().y) * height;
    return { left: cx - w / 2, top: cy - h / 2, right: cx + w / 2, bottom: cy + h / 2 };
}

// In a window of that size: the scrollbar's rail (its end diamonds
// included) and thumb, each { left, top, right, bottom }, or null when no
// scrollbar shows.
export function frameListScrollbar(fake, size) {
    const [rail, ...moreRails] = shownLayers(fake, AVATAR_FRAME_LIST_Z_INDEX.scrollbar);
    const [thumb, ...moreThumbs] = shownLayers(fake, AVATAR_FRAME_LIST_Z_INDEX.scrollbarThumb);
    if (moreRails.length > 0 || moreThumbs.length > 0) throw new Error("more than one scrollbar shows");
    if (!rail && !thumb) return null;
    if (!rail || !thumb) throw new Error("the rail and the thumb show together");
    return { rail: windowRect(rail, size), thumb: windowRect(thumb, size) };
}

// In a window of that size: the footer's rect, the rows' and the Exit
// Button's (each { left, top, right, bottom }), and whether every footer
// text sits inside the footer.
export function frameListFooterLayout(fake, size) {
    const [footer] = shownLayers(fake, AVATAR_FRAME_LIST_Z_INDEX.buttonHints);
    const [exitButton] = shownLayers(fake, AVATAR_FRAME_LIST_Z_INDEX.exitButton);
    const canvas = footer.canvasSize();
    const textsInside = footer.strokes().filter(stroke => "text" in stroke).every(({ rect }) =>
        rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= canvas.width + 2 && rect.y + rect.height <= canvas.height);
    return {
        footer: windowRect(footer, size),
        rows: shownLayers(fake, AVATAR_FRAME_LIST_Z_INDEX.rows).map(layer => windowRect(layer, size)),
        exitButton: windowRect(exitButton, size),
        textsInside,
    };
}
