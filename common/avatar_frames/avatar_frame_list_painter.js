// ============================================================
// Avatar Frame list painter: layout and drawing of the frame list, in the
// Profile Stats' look, in reference pixels (window height = REFERENCE_HEIGHT).
// Only drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "../drawing/steamball_palette.js";
import {
    oneLine, fillGradient, drawAvatar, drawAvatarFrame, avatarFrameSide, buttonHintsFooterRectOf, EXIT_AND_HINTS_METRICS as EXIT_AND_HINTS,
} from "../drawing/steamball_drawing.js";
import { layoutScrollbar, thumbTopAt } from "../drawing/scrollbar.js";

// Above the Profile Stats' band, which never shows at the same time, so
// each reader sees only its own layers.
export const AVATAR_FRAME_LIST_Z_INDEX = Object.freeze({
    backdrop: 6140, title: 6141, rows: 6142, exitButton: 6143, buttonHints: 6144, scrollbar: 6145, scrollbarThumb: 6146, marker: 6150, tooltip: 6151,
});

export const REFERENCE_HEIGHT = 1920;

const LOOK = Object.freeze({
    // The panel's width: a share of the window's, at most maxWidth.
    widthShare: 0.9, maxWidth: 900, pad: 32,
    // The title's line, the Exit Button at its right end, then titleGap
    // down to the rows, room under the button.
    titleH: 72, titleSize: 30, titleGap: 24,
    rowH: 128, rowGap: 10,
    // Above and below the panel at least: rows beyond that scroll.
    minMargin: 50,
    // The Avatar, and its frame a quarter of its size beyond it on every
    // side, inset from the row's left edge.
    avatar: 80, frameInset: 20,
    textGap: 28, nameY: 26, nameSize: 26, minNameSize: 18, statusY: 70, statusSize: 18,
});

const FRAME_SIZE = avatarFrameSide(LOOK.avatar);
const ROW_STEP = LOOK.rowH + LOOK.rowGap;
const PANEL_H_WITHOUT_ROWS = LOOK.pad + LOOK.titleH + LOOK.titleGap + EXIT_AND_HINTS.footerGap + EXIT_AND_HINTS.footerH;
const MAX_ROWS_SHOWN = Math.floor((REFERENCE_HEIGHT - 2 * LOOK.minMargin - PANEL_H_WITHOUT_ROWS + LOOK.rowGap) / ROW_STEP);

// The panel, its title, the Exit Button at the title's right end, the
// first row's place, how many rows show at once (rowCount at most), the
// Button Hints' footer under them and the shared scrollbar in the panel's
// right margin (null when every row shows), in a window referenceWidth wide.
export function layoutFrameList(referenceWidth, rowCount) {
    const rowsShown = Math.min(rowCount, MAX_ROWS_SHOWN);
    const w = Math.min(Math.round(referenceWidth * LOOK.widthShare), LOOK.maxWidth);
    const h = PANEL_H_WITHOUT_ROWS + rowsShown * ROW_STEP - LOOK.rowGap;
    const panel = { x: Math.round((referenceWidth - w) / 2), y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    const x = panel.x + LOOK.pad;
    const rowW = w - 2 * LOOK.pad;
    const title = { x, y: panel.y + LOOK.pad, w: rowW, h: LOOK.titleH };
    const side = EXIT_AND_HINTS.exitButton;
    const exitButton = { x: x + rowW - side, y: title.y + Math.round((title.h - side) / 2), w: side, h: side };
    const firstRow = { x, y: title.y + title.h + LOOK.titleGap, w: rowW, h: LOOK.rowH };
    const buttonHints = buttonHintsFooterRectOf(panel);
    // Drawn at the Button Hints' scale, as the Achievement List's in its
    // smaller pixels.
    const scrollbar = layoutScrollbar({
        centerX: panel.x + w - LOOK.pad / 2, areaTop: firstRow.y, areaHeight: rowsShown * ROW_STEP - LOOK.rowGap,
        listHeight: rowCount * ROW_STEP - LOOK.rowGap, scale: EXIT_AND_HINTS.hintsScale,
    });
    return { panel, title, exitButton, firstRow, rowsShown, buttonHints, scrollbar };
}

// Where the row at index sits while the list shows from the row at topIndex.
export function rowRectOf(geometry, index, topIndex) {
    return { ...geometry.firstRow, y: geometry.firstRow.y + (index - topIndex) * ROW_STEP };
}

// Where the scrollbar's thumb sits while the list shows from the row at topIndex.
export function thumbRectOf(bar, topIndex) {
    return { x: bar.centerX - bar.thumbWidth / 2, y: thumbTopAt(bar, topIndex * ROW_STEP), w: bar.thumbWidth, h: bar.thumbHeight };
}

export function drawTitle(host, dc, title, w, h) {
    oneLine(host, dc, title, { x: 0, y: 0, width: w, height: h, size: LOOK.titleSize, weight: 700, color: COLORS.gold, font: FONTS.display, align: "center" });
}

// row: { name, status (null, the worn mark or the unlock condition),
// isLocked, isWorn, avatarPath, framePath (null for none) }. The Avatar
// first, then its frame over it; the name, then the status under it.
export function drawRow(host, dc, row, w, h) {
    fillGradient(dc, 0, 0, w, h, row.isLocked ? COLORS.rowMissing : COLORS.rowUnlocked, COLORS.tile);
    dc.frameRect(0, 0, w, h, row.isWorn ? 2 : 1, row.isWorn ? COLORS.gold : COLORS.border);
    const frameX = LOOK.frameInset;
    const frameY = Math.round((h - FRAME_SIZE) / 2);
    const margin = (FRAME_SIZE - LOOK.avatar) / 2;
    drawAvatar(dc, row.avatarPath, frameX + margin, frameY + margin, LOOK.avatar);
    drawAvatarFrame(dc, row.framePath, frameX + margin, frameY + margin, LOOK.avatar);
    const textX = frameX + FRAME_SIZE + LOOK.textGap;
    const textW = w - textX - LOOK.textGap;
    oneLine(host, dc, row.name, {
        x: textX, y: LOOK.nameY, width: textW, size: LOOK.nameSize, minSize: LOOK.minNameSize, weight: 700,
        color: row.isLocked ? COLORS.description : COLORS.title, font: FONTS.display,
    });
    if (row.status !== null) {
        oneLine(host, dc, row.status, {
            x: textX, y: LOOK.statusY, width: textW, size: LOOK.statusSize, weight: 600, color: row.isWorn ? COLORS.gold : COLORS.description,
        });
    }
}
