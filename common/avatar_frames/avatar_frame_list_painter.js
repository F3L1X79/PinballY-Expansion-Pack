// ============================================================
// Avatar Frame list painter: the layout and drawing of the list opened
// from the Profile Stats' Frame button, in reference pixels (the window's
// height is REFERENCE_HEIGHT), in the Profile Stats' own look: the
// centred Steamball panel (drawn by steamball_drawing.js's backdrop), its title, one row per frame
// (the player's Avatar in that frame, the frame's name, and the worn mark
// or the unlock condition), the Exit Button at the title's right end with
// its tooltip shown while it is selected, and the Button Hints in a footer
// under the rows; the Selection Marker surrounds the selected row or the
// Exit Button. Only drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "../drawing/steamball_palette.js";
import {
    oneLine, fillGradient, drawAvatar, drawAvatarFrame, avatarFrameSide, drawExitButton as drawExitButtonTile, drawButtonHints as drawButtonHintsCentred, tooltip,
} from "../drawing/steamball_drawing.js";

// Above the Profile Stats' band, which never shows at the same time, so
// each reader sees only its own layers.
export const AVATAR_FRAME_LIST_Z_INDEX = Object.freeze({ backdrop: 6140, title: 6141, rows: 6142, exitButton: 6143, buttonHints: 6144, marker: 6150, tooltip: 6151 });

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
    // The Exit Button at the title's right end, as on the Profile Stats,
    // with room on its left for its tooltip, and round it on the tooltip's layer.
    exitButton: 56, exitTooltipRoom: 240, tooltipMargin: 16,
    // The Button Hints' footer under the rows, a rule on its top; their
    // look at hintsScale times the Achievement List's, as on the Household Stats.
    footerGap: 16, footerH: 96, hintsScale: 1.5,
});

const FRAME_SIZE = avatarFrameSide(LOOK.avatar);

// The panel, its title, the Exit Button, each of rowCount rows and the
// Button Hints' footer, in a window referenceWidth wide.
export function layoutFrameList(referenceWidth, rowCount) {
    const w = Math.min(Math.round(referenceWidth * LOOK.widthShare), LOOK.maxWidth);
    const rowsH = rowCount * (LOOK.rowH + LOOK.rowGap) - LOOK.rowGap;
    const h = 2 * LOOK.pad + LOOK.titleH + rowsH + LOOK.footerGap + LOOK.footerH;
    const panel = { x: Math.round((referenceWidth - w) / 2), y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    const x = panel.x + LOOK.pad;
    const rowW = w - 2 * LOOK.pad;
    const title = { x, y: panel.y + LOOK.pad, w: rowW, h: LOOK.titleH };
    const exitButton = { x: x + rowW - LOOK.exitButton, y: title.y + Math.round((title.h - LOOK.exitButton) / 2), w: LOOK.exitButton, h: LOOK.exitButton };
    const rows = Array.from({ length: rowCount }, (_, index) =>
        ({ x, y: title.y + title.h + index * (LOOK.rowH + LOOK.rowGap), w: rowW, h: LOOK.rowH }));
    const buttonHints = { x, y: title.y + title.h + rowsH + LOOK.footerGap, w: rowW, h: LOOK.footerH };
    return { panel, title, exitButton, rows, buttonHints };
}

// The Exit Button's tooltip layer, with the tooltip on the button's left:
// its rect leaves room for it.
export function exitTooltipRectOf(exitButton) {
    const M = LOOK.tooltipMargin;
    return { x: exitButton.x - LOOK.exitTooltipRoom, y: exitButton.y - M, w: LOOK.exitTooltipRoom + exitButton.w + M, h: exitButton.h + 2 * M };
}

// look: an EXIT_BUTTON_LOOK.
export function drawExitButton(dc, look) {
    drawExitButtonTile(dc, look, 0, 0, LOOK.exitButton);
}

export function drawExitTooltip(host, dc, label) {
    const M = LOOK.tooltipMargin;
    tooltip(host, dc, label, LOOK.exitTooltipRoom - 18, M + LOOK.exitButton / 2, "left");
}

// The footer w by h: a rule on its top, the Button Hints (groups) centred.
export function drawButtonHints(host, dc, groups, w, h) {
    dc.fillRect(0, 0, w, 1, COLORS.border);
    drawButtonHintsCentred(host, dc, groups, { x: 0, y: 0, width: w, height: h, scale: LOOK.hintsScale });
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
