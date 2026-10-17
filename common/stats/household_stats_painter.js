// ============================================================
// Household Stats painter: the layout and drawing of the Household Stats'
// pieces, in reference pixels (the window's height is REFERENCE_HEIGHT),
// in the Profile Stats' look: the centred Steamball panel (drawn by
// steamball_drawing.js's backdrop), its title, the line labels in a column
// on the left, then one column per Profile (its Avatar in its worn Avatar
// Frame, with no Player Level pip, and its name as a header, then one cell
// per line, the best values in gold, the Collection Mastery with its
// Collection Tier square, the pair centred), the Exit Button at the top
// right with its tooltip shown while it is selected (the Selection
// Marker surrounds the selected column or the Exit Button), and the
// Button Hints in a footer under the columns.
// Past five columns, or fewer in a narrow window, the layout also gives
// the view the columns show through and their pitch, for the module to
// glide them sideways. Only drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "../drawing/steamball_palette.js";
import {
    oneLine, drawAvatar, drawAvatarFrame, avatarFrameSide, AVATAR_FRAME_MARGIN, UNBOUNDED, buttonHintsFooterRectOf, EXIT_AND_HINTS_METRICS as EXIT_AND_HINTS,
} from "../drawing/steamball_drawing.js";
import { drawMasterySquare, masterySquareSize } from "../mastery/mastery_square.js";

// Above the Avatar Frame list's band, which never shows at the same time,
// so each reader sees only its own layers.
export const HOUSEHOLD_STATS_Z_INDEX = Object.freeze({ backdrop: 6160, title: 6161, labels: 6162, columns: 6163, exitButton: 6164, buttonHints: 6165, marker: 6169, tooltip: 6170 });

export const REFERENCE_HEIGHT = 1920;

// At most that many columns in view, fewer when the window is too
// narrow for them at columnMinW: the others glide in sideways.
const MAX_COLUMNS = 5;

const LOOK = Object.freeze({
    // The panel's width: a share of the window's, at most what its columns need.
    widthShare: 0.9, pad: 32,
    titleH: 72, titleSize: 30, titleGap: 24,
    // The labels' column, then each Profile's, columnMinW to columnMaxW wide.
    labelsW: 300, labelSize: 21, minLabelSize: 15, columnGap: 20, columnMinW: 160, columnMaxW: 230,
    // A column's header: the Avatar, room for its frame on every side
    // whether worn or not (so the columns line up), small enough for the
    // frame to fit the narrowest column, then the name under it.
    avatar: 104, nameGap: 4, nameH: 40, nameSize: 24, minNameSize: 16, headerH: 212,
    // Each line: its height, its value at valueSize, a thin rule under it.
    lineH: 76, valueSize: 28, minValueSize: 18, squareK: 0.6, squareGap: 10,
});

// How wide a column's Avatar Frame is drawn, for its image's size.
export const AVATAR_FRAME_WIDTH = avatarFrameSide(LOOK.avatar);

// The Avatar's top, below its frame's room; the name's, below the frame.
const AVATAR_Y = LOOK.avatar * AVATAR_FRAME_MARGIN;
const NAME_Y = AVATAR_FRAME_WIDTH + LOOK.nameGap;

// The panel, its title, the Exit Button at the title's right end, the labels' column, each column as if
// none were scrolled (the first ones in view, the others lined up after
// them), the view the columns show through and their pitch, the Button
// Hints' footer under the columns, in a window
// referenceWidth wide, for columnCount columns and lineCount lines.
export function layoutHouseholdStats(referenceWidth, columnCount, lineCount) {
    const widest = Math.round(referenceWidth * LOOK.widthShare);
    const fitting = Math.floor((widest - 2 * LOOK.pad - LOOK.labelsW) / (LOOK.columnGap + LOOK.columnMinW));
    const shown = Math.max(1, Math.min(columnCount, MAX_COLUMNS, fitting));
    const room = widest - 2 * LOOK.pad - LOOK.labelsW - shown * LOOK.columnGap;
    const columnW = Math.max(LOOK.columnMinW, Math.min(LOOK.columnMaxW, Math.floor(room / shown)));
    const w = 2 * LOOK.pad + LOOK.labelsW + shown * (LOOK.columnGap + columnW);
    const tableH = LOOK.headerH + lineCount * LOOK.lineH;
    const h = LOOK.pad + LOOK.titleH + LOOK.titleGap + tableH + EXIT_AND_HINTS.footerGap + EXIT_AND_HINTS.footerH;
    const panel = { x: Math.round((referenceWidth - w) / 2), y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    const x = panel.x + LOOK.pad;
    const title = { x, y: panel.y + LOOK.pad, w: w - 2 * LOOK.pad, h: LOOK.titleH };
    const side = EXIT_AND_HINTS.exitButton;
    const exitButton = { x: panel.x + w - LOOK.pad - side, y: title.y + Math.round((title.h - side) / 2), w: side, h: side };
    const tableY = title.y + title.h + LOOK.titleGap;
    const labels = { x, y: tableY, w: LOOK.labelsW, h: tableH };
    const pitch = columnW + LOOK.columnGap;
    const firstX = x + LOOK.labelsW + LOOK.columnGap;
    const columns = Array.from({ length: columnCount }, (_, index) => ({ x: firstX + index * pitch, y: tableY, w: columnW, h: tableH }));
    const view = { x: firstX, w: shown * pitch - LOOK.columnGap, count: shown };
    const buttonHints = buttonHintsFooterRectOf(panel);
    return { panel, title, exitButton, labels, columns, view, pitch, buttonHints };
}

export function drawTitle(host, dc, title, w, h) {
    oneLine(host, dc, title, { x: 0, y: 0, width: w, height: h, size: LOOK.titleSize, weight: 700, color: COLORS.gold, font: FONTS.display, align: "center" });
}

const lineY = index => LOOK.headerH + index * LOOK.lineH;

// A thin rule under each line, across the piece.
function drawRules(dc, w, lineCount) {
    for (let index = 0; index < lineCount; index++) dc.fillRect(0, lineY(index + 1) - 1, w, 1, COLORS.border);
}

// The line labels, top down, level with the columns' cells.
export function drawLabels(host, dc, labels, w) {
    labels.forEach((label, index) => oneLine(host, dc, label, {
        x: 0, y: lineY(index), width: w, height: LOOK.lineH, size: LOOK.labelSize, minSize: LOOK.minLabelSize, weight: 400, color: COLORS.description,
    }));
    drawRules(dc, w, labels.length);
}

function measureValue(host, value) {
    const styled = host.createStyledText({ textAlign: "left", textStyle: { font: FONTS.display, size: LOOK.valueSize, weight: 700, color: COLORS.title } });
    styled.add(value);
    return styled.measure(UNBOUNDED).width;
}

// A cell: its value, gold when it is the line's best; the Collection
// Mastery's with its Collection Tier square on its left, the pair centred
// as the other values are, the square drawn after the value so the value
// stays the cell's first text. At tier 0 the square takes level 1's
// metal, as on the Profile Stats card.
function drawCell(host, dc, cell, y, w) {
    const style = {
        y, height: LOOK.lineH, size: LOOK.valueSize, minSize: LOOK.minValueSize, weight: 700,
        color: cell.isGold ? COLORS.gold : COLORS.title, font: FONTS.display,
    };
    if (cell.tier === undefined) {
        oneLine(host, dc, cell.value, { ...style, x: 0, width: w, align: "center" });
        return;
    }
    const size = masterySquareSize(LOOK.squareK);
    const valueRoom = w - size - LOOK.squareGap;
    // A value too wide for its room shrinks in it, the pair then filling the cell.
    const left = Math.max(0, Math.round((valueRoom - measureValue(host, cell.value)) / 2));
    const x = left + size + LOOK.squareGap;
    oneLine(host, dc, cell.value, { ...style, x, width: w - x });
    drawMasterySquare(host, dc, cell.tier, left, y + Math.round((LOOK.lineH - size) / 2), LOOK.squareK, Math.max(1, cell.tier));
}

// column: { name, avatarPath (null: none), framePath (the worn Avatar
// Frame's image, null: none), cells: [{ value, isGold, tier (the
// Collection Tier, only on the Collection Mastery's line) }] }. The name
// first, then the cells top down.
export function drawColumn(host, dc, column, w) {
    const avatarX = Math.round((w - LOOK.avatar) / 2);
    drawAvatar(dc, column.avatarPath, avatarX, AVATAR_Y, LOOK.avatar);
    drawAvatarFrame(dc, column.framePath, avatarX, AVATAR_Y, LOOK.avatar);
    oneLine(host, dc, column.name, {
        x: 0, y: NAME_Y, width: w, height: LOOK.nameH, size: LOOK.nameSize, minSize: LOOK.minNameSize, weight: 700, font: FONTS.display, align: "center",
    });
    column.cells.forEach((cell, index) => drawCell(host, dc, cell, lineY(index), w));
    drawRules(dc, w, column.cells.length);
}
