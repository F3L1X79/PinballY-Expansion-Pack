// ============================================================
// Avatar Frame list painter: the layout and drawing of the list opened
// from the Profile Stats' Frame button, in reference pixels (the window's
// height is REFERENCE_HEIGHT), in the Profile Stats' own look: the
// centred Steamball panel (drawn by steamball_drawing.js's backdrop), its title, one row per frame
// (the player's Avatar in that frame, the frame's name, and the worn mark
// or the unlock condition) and the gold halo of the highlighted row. Only
// drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";
import { oneLine, fillGradient, drawAvatar, drawAvatarFrame, avatarFrameSide, selectionHalo } from "./steamball_drawing.js";

// Above the Profile Stats' band, which never shows at the same time, so
// each reader sees only its own layers.
export const AVATAR_FRAME_LIST_Z_INDEX = Object.freeze({ backdrop: 6140, title: 6141, rows: 6142, highlight: 6150 });

export const REFERENCE_HEIGHT = 1920;

const LOOK = Object.freeze({
    // The panel's width: a share of the window's, at most maxWidth.
    widthShare: 0.9, maxWidth: 900, pad: 32,
    titleH: 72, titleSize: 30,
    rowH: 128, rowGap: 10,
    // The Avatar, and its frame a quarter of its size beyond it on every
    // side, inset from the row's left edge.
    avatar: 80, frameInset: 20,
    textGap: 28, nameY: 26, nameSize: 26, minNameSize: 18, statusY: 70, statusSize: 18,
    haloMargin: 20,
});

const FRAME_SIZE = avatarFrameSide(LOOK.avatar);

// The panel, its title and each of rowCount rows, in a window
// referenceWidth wide.
export function layoutFrameList(referenceWidth, rowCount) {
    const w = Math.min(Math.round(referenceWidth * LOOK.widthShare), LOOK.maxWidth);
    const h = 2 * LOOK.pad + LOOK.titleH + rowCount * (LOOK.rowH + LOOK.rowGap) - LOOK.rowGap;
    const panel = { x: Math.round((referenceWidth - w) / 2), y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    const x = panel.x + LOOK.pad;
    const rowW = w - 2 * LOOK.pad;
    const title = { x, y: panel.y + LOOK.pad, w: rowW, h: LOOK.titleH };
    const rows = Array.from({ length: rowCount }, (_, index) =>
        ({ x, y: title.y + title.h + index * (LOOK.rowH + LOOK.rowGap), w: rowW, h: LOOK.rowH }));
    return { panel, title, rows };
}

// The halo's rect around a row's, centred on it as the reader expects.
export function haloRectOf(rect) {
    const M = LOOK.haloMargin;
    return { x: rect.x - M, y: rect.y - M, w: rect.w + 2 * M, h: rect.h + 2 * M };
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

export function drawHalo(dc, w, h) {
    const M = LOOK.haloMargin;
    selectionHalo(dc, M, M, w - 2 * M, h - 2 * M);
}
