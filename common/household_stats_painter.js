// ============================================================
// Household Stats painter: the layout and drawing of the Household Stats'
// pieces, in reference pixels (the window's height is REFERENCE_HEIGHT),
// in the Profile Stats' look: the centred Steamball panel (drawn by
// steamball_drawing.js's backdrop), its title, the line labels in a column
// on the left, then one column per Profile (its Avatar and name as a
// header, then one cell per line, the best values in gold, the Collection
// Mastery with its Collection Tier square) and the gold halo of the
// highlighted column. Only drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";
import { oneLine, drawAvatar, selectionHalo } from "./steamball_drawing.js";
import { drawMasterySquare, masterySquareSize } from "./mastery_square.js";

// Above the Avatar Frame list's band, which never shows at the same time,
// so each reader sees only its own layers.
export const HOUSEHOLD_STATS_Z_INDEX = Object.freeze({ backdrop: 6160, title: 6161, labels: 6162, columns: 6163, highlight: 6170 });

export const REFERENCE_HEIGHT = 1920;

// At most that many columns side by side.
const MAX_COLUMNS = 5;

const LOOK = Object.freeze({
    // The panel's width: a share of the window's, at most what its columns need.
    widthShare: 0.9, pad: 32,
    titleH: 72, titleSize: 30, titleGap: 24,
    // The labels' column, then each Profile's, at most columnMaxW wide.
    labelsW: 300, labelSize: 21, minLabelSize: 15, columnGap: 20, columnMaxW: 230,
    // A column's header: the Avatar, then the name under it.
    avatar: 112, avatarY: 16, nameY: 140, nameH: 40, nameSize: 24, minNameSize: 16, headerH: 196,
    // Each line: its height, its value at valueSize, a thin rule under it.
    lineH: 76, valueSize: 28, minValueSize: 18, squareK: 0.6, squareGap: 10,
    haloMargin: 16,
});

// The panel, its title, the labels' column and each column, in a window
// referenceWidth wide, for columnCount columns and lineCount lines.
export function layoutHouseholdStats(referenceWidth, columnCount, lineCount) {
    const shown = Math.min(columnCount, MAX_COLUMNS);
    const widest = Math.round(referenceWidth * LOOK.widthShare);
    const room = widest - 2 * LOOK.pad - LOOK.labelsW - shown * LOOK.columnGap;
    const columnW = Math.min(LOOK.columnMaxW, Math.floor(room / shown));
    const w = 2 * LOOK.pad + LOOK.labelsW + shown * (LOOK.columnGap + columnW);
    const tableH = LOOK.headerH + lineCount * LOOK.lineH;
    const h = 2 * LOOK.pad + LOOK.titleH + LOOK.titleGap + tableH;
    const panel = { x: Math.round((referenceWidth - w) / 2), y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    const x = panel.x + LOOK.pad;
    const title = { x, y: panel.y + LOOK.pad, w: w - 2 * LOOK.pad, h: LOOK.titleH };
    const tableY = title.y + title.h + LOOK.titleGap;
    const labels = { x, y: tableY, w: LOOK.labelsW, h: tableH };
    const columns = Array.from({ length: columnCount }, (_, index) =>
        ({ x: x + LOOK.labelsW + LOOK.columnGap + index * (columnW + LOOK.columnGap), y: tableY, w: columnW, h: tableH }));
    return { panel, title, labels, columns };
}

// The halo's rect around a column's, centred on it as the reader expects.
export function haloRectOf(rect) {
    const M = LOOK.haloMargin;
    return { x: rect.x - M, y: rect.y - M, w: rect.w + 2 * M, h: rect.h + 2 * M };
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

// A cell: its value, gold when it is the line's best; the Collection
// Mastery's with its Collection Tier square on its left, drawn after the
// value so the value stays the cell's first text. At tier 0 the square
// takes level 1's metal, as on the Profile Stats card.
function drawCell(host, dc, cell, y, w) {
    const hasSquare = cell.tier !== undefined;
    const size = masterySquareSize(LOOK.squareK);
    const x = hasSquare ? size + LOOK.squareGap : 0;
    oneLine(host, dc, cell.value, {
        x, y, width: w - x, height: LOOK.lineH, size: LOOK.valueSize, minSize: LOOK.minValueSize, weight: 700,
        color: cell.isGold ? COLORS.gold : COLORS.title, font: FONTS.display, align: hasSquare ? "left" : "center",
    });
    if (hasSquare) drawMasterySquare(host, dc, cell.tier, 0, y + Math.round((LOOK.lineH - size) / 2), LOOK.squareK, Math.max(1, cell.tier));
}

// column: { name, avatarPath (null: none), cells: [{ value, isGold, tier
// (the Collection Tier, only on the Collection Mastery's line) }] }. The
// name first, then the cells top down.
export function drawColumn(host, dc, column, w) {
    const avatarX = Math.round((w - LOOK.avatar) / 2);
    drawAvatar(dc, column.avatarPath, avatarX, LOOK.avatarY, LOOK.avatar);
    oneLine(host, dc, column.name, {
        x: 0, y: LOOK.nameY, width: w, height: LOOK.nameH, size: LOOK.nameSize, minSize: LOOK.minNameSize, weight: 700, font: FONTS.display, align: "center",
    });
    column.cells.forEach((cell, index) => drawCell(host, dc, cell, lineY(index), w));
    drawRules(dc, w, column.cells.length);
}

export function drawHalo(dc, w, h) {
    const M = LOOK.haloMargin;
    selectionHalo(dc, M, M, w - 2 * M, h - 2 * M);
}
