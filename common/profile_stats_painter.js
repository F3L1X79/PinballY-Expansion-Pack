// ============================================================
// Profile Stats painter: the layout and drawing of the Profile Stats'
// pieces, in reference pixels (the window's height is REFERENCE_HEIGHT),
// from the prototype validated on the cabinet: the dimmed backdrop with
// the centred Steamball panel, the card on the left (Avatar, the Profile's
// name in gold, the buttons at its foot), the close cross and the right
// column's sections (a title, then rows of stats, label over value), the
// spare height shared evenly between the column's gaps, and one highlight
// per choice (a gold halo, with a tooltip for the cross). Only drawing: no
// layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";
import {
    text, oneLine, fillGradient, drawAvatar, drawCross, tooltip, selectionHalo, drawBackdrop as drawPanelBackdrop, UNBOUNDED,
} from "./steamball_drawing.js";

// In the Welcome Screen's band, which never shows at the same time, above
// its own values so each screen's reader sees only its own layers.
export const PROFILE_STATS_Z_INDEX = Object.freeze({ backdrop: 6120, card: 6121, buttons: 6122, sections: 6123, cross: 6124, highlights: 6130 });

export const REFERENCE_HEIGHT = 1920;

export const CHOICE = Object.freeze({ CLOSE: "close", ACHIEVEMENTS: "achievements", MOST_PLAYED: "mostPlayed", TO_DISCOVER: "toDiscover" });


const LOOK = Object.freeze({
    pad: 40, cross: 56,
    // The panel's width: a share of the window's, at most maxWidth.
    widthShare: 0.9, maxWidth: 1500,
    // The card: its share of the inner width, its inset, the gap to the column.
    cardShare: 0.4, cardInset: 28, columnGap: 48,
    avatar: 190, avatarGap: 12, nameH: 66, nameSize: 34, minNameSize: 24, buttonsGap: 40,
    button: Object.freeze({ h: 74, gap: 14, size: 22, minSize: 17, countSize: 22 }),
    // The column: a section title, rows of stats side by side, label over value.
    titleH: 60, titleSize: 20, ruleY: 34, statGap: 32, labelSize: 20, minLabelSize: 16, valueY: 26, valueSize: 36, minValueSize: 22, rowH: 78,
    sectionGap: 20, rowGap: 18,
    // Room around a highlighted element for its halo, and beside the cross
    // for its tooltip.
    haloMargin: 20, crossTooltipRoom: 240,
});

// ---------- Layout ----------

// The column's blocks top down; the spare height goes to the gaps only.
function columnBlocks(screen) {
    const blocks = [];
    screen.sections.forEach((section, index) => {
        if (index > 0) blocks.push({ kind: "gap", h: LOOK.sectionGap, isSpread: true });
        blocks.push({ kind: "title", h: LOOK.titleH, section, isFirst: index === 0 });
        section.rows.forEach((stats, rowIndex) => {
            if (rowIndex > 0) blocks.push({ kind: "gap", h: LOOK.rowGap, isSpread: true });
            blocks.push({ kind: "row", h: LOOK.rowH, section, stats });
        });
    });
    return blocks;
}

function cardHeight(screen, avatar) {
    const { button } = LOOK;
    const buttonsH = screen.buttons.length * (button.h + button.gap) - button.gap;
    return LOOK.cardInset + avatar + LOOK.avatarGap + LOOK.nameH + LOOK.buttonsGap + buttonsH + LOOK.cardInset;
}

// The panel, the card and the column in a window referenceWidth wide; the
// panel is as tall as the taller of the card and the column.
function geometry(referenceWidth, screen) {
    const w = Math.min(Math.round(referenceWidth * LOOK.widthShare), LOOK.maxWidth);
    const innerW = w - 2 * LOOK.pad;
    const cardW = Math.round(innerW * LOOK.cardShare);
    const contentW = cardW - 2 * LOOK.cardInset;
    const avatar = Math.min(contentW, LOOK.avatar);
    const columnX = LOOK.pad + cardW + LOOK.columnGap;
    const columnW = w - LOOK.pad - columnX;
    const blocks = columnBlocks(screen);
    const naturalH = blocks.reduce((sum, block) => sum + block.h, 0);
    const innerH = Math.max(cardHeight(screen, avatar), naturalH);
    const spreads = blocks.filter(block => block.isSpread).length;
    const spare = spreads === 0 ? 0 : (innerH - naturalH) / spreads;
    let y = 0;
    for (const block of blocks) {
        block.y = Math.round(y);
        y += block.h + (block.isSpread ? spare : 0);
    }
    const h = innerH + 2 * LOOK.pad;
    const panel = { x: Math.round((referenceWidth - w) / 2), y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    return { panel, innerW, innerH, cardW, contentW, avatar, columnX, columnW, blocks };
}

// The backdrop: the dimmed wheel and the panel, drawn on a window-sized
// canvas whose height is REFERENCE_HEIGHT * scale.
export function drawBackdrop(dc, size, referenceWidth, screen) {
    drawPanelBackdrop(dc, size, REFERENCE_HEIGHT, geometry(referenceWidth, screen).panel);
}

function measureWidth(host, str, { size, weight, font = FONTS.body }) {
    const styled = host.createStyledText({ textAlign: "left", textStyle: { font, size, weight, color: COLORS.title } });
    styled.add(str);
    return Math.ceil(styled.measure(UNBOUNDED).width);
}

// A button: a tile with its label, and its count in grey on its right.
function drawButton(host, dc, entry, w, h) {
    const { button } = LOOK;
    fillGradient(dc, 0, 0, w, h, COLORS.rowUnlocked, COLORS.tile);
    dc.frameRect(0, 0, w, h, 1, COLORS.border);
    // The label is drawn first, so the count is measured ahead.
    const countW = entry.count === null ? 0 : measureWidth(host, entry.count, { size: button.countSize, weight: 600 });
    oneLine(host, dc, entry.label, { x: 20, y: 0, width: w - 52 - countW, height: h, size: button.size, minSize: button.minSize, weight: 700, font: FONTS.display });
    if (entry.count !== null) oneLine(host, dc, entry.count, { x: 20, y: 0, width: w - 40, height: h, size: button.countSize, weight: 600, color: COLORS.description, align: "right" });
}

// A section of the column: its title and rule, then its rows of stats.
function drawSection(host, dc, blocks, top, columnW) {
    for (const block of blocks) {
        const y = block.y - top;
        if (block.kind === "title") {
            // The first title stops short of the cross.
            const width = block.isFirst ? columnW - LOOK.cross - 24 : columnW;
            text(host, dc, block.section.title, { x: 0, y, width, size: LOOK.titleSize, weight: 700, color: COLORS.gold, font: FONTS.display });
            dc.fillRect(0, y + LOOK.ruleY, width, 1, COLORS.border);
        } else if (block.kind === "row") {
            const colW = Math.round((columnW - LOOK.statGap * (block.stats.length - 1)) / block.stats.length);
            block.stats.forEach((stat, index) => {
                const x = index * (colW + LOOK.statGap);
                oneLine(host, dc, stat.label, { x, y, width: colW, size: LOOK.labelSize, minSize: LOOK.minLabelSize, weight: 400, color: COLORS.description });
                oneLine(host, dc, stat.value, { x, y: y + LOOK.valueY, width: colW, size: LOOK.valueSize, minSize: LOOK.minValueSize, weight: 700, font: FONTS.display });
            });
        }
    }
}

// screen: { name, avatarPath, buttons (each { choice, label, count: null
// or a string }), sections (each { title, rows: [[{ label, value }]] }),
// closeLabel }. Returns the pieces, each { zIndex, rect, draw(dc) } drawn
// in its rect's own coordinates, and the highlight of each choice.
export function layoutProfileStats(host, screen, referenceWidth) {
    const { panel, innerH, cardW, contentW, avatar, columnX, columnW, blocks } = geometry(referenceWidth, screen);
    const top = panel.y + LOOK.pad;
    const cardX = panel.x + LOOK.pad;
    const pieces = [{
        zIndex: PROFILE_STATS_Z_INDEX.card,
        rect: { x: cardX, y: top, w: cardW, h: innerH },
        draw: dc => {
            fillGradient(dc, 0, 0, cardW, innerH, COLORS.panelTop, COLORS.tile);
            dc.frameRect(0, 0, cardW, innerH, 2, COLORS.border);
            drawAvatar(dc, screen.avatarPath, Math.round((cardW - avatar) / 2), LOOK.cardInset, avatar);
            oneLine(host, dc, screen.name, {
                x: LOOK.cardInset, y: LOOK.cardInset + avatar + LOOK.avatarGap, width: contentW, height: LOOK.nameH,
                size: LOOK.nameSize, minSize: LOOK.minNameSize, weight: 700, color: COLORS.gold, font: FONTS.display, align: "center",
            });
        },
    }];

    const M = LOOK.haloMargin;
    const highlightPiece = (rect, draw) => ({ zIndex: PROFILE_STATS_Z_INDEX.highlights, rect, draw });
    // Centred on what it surrounds, as the reader expects.
    const haloAround = rect => highlightPiece(
        { x: rect.x - M, y: rect.y - M, w: rect.w + 2 * M, h: rect.h + 2 * M },
        dc => selectionHalo(dc, M, M, rect.w, rect.h)
    );
    const highlights = {};

    // At the card's foot, whatever the panel's height.
    const { button } = LOOK;
    let buttonY = top + innerH - LOOK.cardInset - (screen.buttons.length * (button.h + button.gap) - button.gap);
    for (const entry of screen.buttons) {
        const rect = { x: cardX + LOOK.cardInset, y: buttonY, w: contentW, h: button.h };
        pieces.push({ zIndex: PROFILE_STATS_Z_INDEX.buttons, rect, draw: dc => drawButton(host, dc, entry, rect.w, rect.h) });
        highlights[entry.choice] = haloAround(rect);
        buttonY += button.h + button.gap;
    }

    // One piece per section, down to the next section's title.
    const sectionStarts = blocks.filter(block => block.kind === "title");
    sectionStarts.forEach((start, index) => {
        const next = sectionStarts[index + 1];
        const sectionBlocks = blocks.filter(block => block.section === start.section);
        const sectionH = (next ? next.y : innerH) - start.y;
        pieces.push({
            zIndex: PROFILE_STATS_Z_INDEX.sections,
            rect: { x: panel.x + columnX, y: top + start.y, w: columnW, h: sectionH },
            draw: dc => drawSection(host, dc, sectionBlocks, start.y, columnW),
        });
    });

    const crossX = panel.x + panel.w - LOOK.pad - LOOK.cross;
    pieces.push({
        zIndex: PROFILE_STATS_Z_INDEX.cross,
        rect: { x: crossX, y: top, w: LOOK.cross, h: LOOK.cross },
        draw: dc => drawCross(dc, 0, 0, LOOK.cross),
    });
    // The tooltip sits on the cross's left; the rect leaves room for it.
    const crossRoom = LOOK.crossTooltipRoom;
    highlights[CHOICE.CLOSE] = highlightPiece(
        { x: crossX - crossRoom, y: top - M, w: crossRoom + LOOK.cross + M, h: LOOK.cross + 2 * M },
        dc => {
            selectionHalo(dc, crossRoom, M, LOOK.cross, LOOK.cross);
            tooltip(host, dc, screen.closeLabel, crossRoom - 18, M + LOOK.cross / 2, "left");
        }
    );
    return { pieces, highlights };
}
