// ============================================================
// Profile Stats painter: the layout and drawing of the Profile Stats'
// pieces, in reference pixels (the window's height is REFERENCE_HEIGHT),
// from the prototype validated on the cabinet: the dimmed backdrop with
// the centred Steamball panel, the card on the left framed in the Player
// Level colour with a soft glow (Avatar, the Profile's name in gold, the
// Player Level in big digits with its bar and points, a rule, the
// Collection Mastery stacked like the Mastery Bar, the buttons at its
// foot), the close cross and the right column's sections (a title, then
// rows of stats, label over value, with a pill beside the value, or every
// pill of the row under its value when one does not fit, and a thin bar),
// the spare height shared evenly between the column's gaps, and one highlight
// per choice (a gold halo, with a tooltip for the cross). Only drawing: no
// layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";
import { metalOf, tierMetalOf, tierOf, mix, MAX_MASTERY_LEVEL } from "./table_mastery.js";
import {
    text, oneLine, fillGradient, fillRounded, glow, drawAvatar, drawCross, tooltip, selectionHalo, drawBackdrop as drawPanelBackdrop, UNBOUNDED,
} from "./steamball_drawing.js";
import { drawMasterySquare, masterySquareSize } from "./mastery_square.js";

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
    // The card's soft glow, in rings around its frame.
    cardGlow: 6, cardGlowPeak: 0x40,
    // The Player Level block, top down: its title, the digits (their box
    // taller than they are, so the bar sits clear below), the bar, the points.
    playerLevel: Object.freeze({ titleH: 26, titleSize: 17, digitsH: 130, digitsSize: 96, digitsLift: 16, barH: 14, barGap: 12, pointsH: 58, pointsSize: 19 }),
    // The rule, then the Collection Mastery's title and block, its square
    // scaled by squareK.
    ruleH: 31, // Inside the block: the left inset, the goal's, bar's and count's tops,
    // the gaps to the square and from it to the right edge.
    collection: Object.freeze({
        titleH: 34, titleSize: 17, h: 124, squareK: 1.1, goalSize: 18, minGoalSize: 15, barH: 10, currentSize: 16,
        inset: 20, goalY: 18, barY: 64, currentY: 86, barGap: 22, squareInset: 18,
    }),
    button: Object.freeze({ h: 74, gap: 14, size: 22, minSize: 17, countSize: 22 }),
    // The column: a section title, rows of stats side by side, label over value.
    titleH: 60, titleSize: 20, ruleY: 34, statGap: 32, labelSize: 20, minLabelSize: 16, valueY: 26, valueSize: 36, minValueSize: 22, rowH: 78,
    sectionGap: 20, rowGap: 18,
    // A stat's pill: beside its value (gap), or under it (underGap); gold
    // when lit, its background the gold mixed that far into the panel.
    pill: Object.freeze({ h: 30, size: 16, weight: 600, padX: 14, gap: 14, underGap: 16, litMix: 0.78 }),
    // A stat's thin bar under its value (or its pill), short of the
    // column's right edge by inset.
    shareBar: Object.freeze({ h: 6, gap: 8, inset: 24 }),
    // Room around a highlighted element for its halo, and beside the cross
    // for its tooltip.
    haloMargin: 20, crossTooltipRoom: 240,
});

// ---------- Layout ----------

function measureWidth(host, str, { size, weight, font = FONTS.body }) {
    const styled = host.createStyledText({ textAlign: "left", textStyle: { font, size, weight, color: COLORS.title } });
    styled.add(str);
    return Math.ceil(styled.measure(UNBOUNDED).width);
}

const pillWidth = (host, str) => measureWidth(host, str, { size: LOOK.pill.size, weight: LOOK.pill.weight }) + 2 * LOOK.pill.padX;

// A row of stats side by side in the column: every pill goes under its
// value when one does not fit beside its own, so the row stays aligned.
function rowBlock(host, section, stats, columnW) {
    const { pill, shareBar } = LOOK;
    const colW = Math.round((columnW - LOOK.statGap * (stats.length - 1)) / stats.length);
    const valueWidth = stat => Math.min(colW, measureWidth(host, stat.value, { size: LOOK.valueSize, weight: 700, font: FONTS.display }));
    const isUnder = stats.some(stat => stat.pill && valueWidth(stat) + pill.gap + pillWidth(host, stat.pill.text) > colW);
    const hasShare = stats.some(stat => stat.share !== undefined);
    const h = LOOK.rowH + (isUnder ? pill.underGap + pill.h : 0) + (hasShare ? shareBar.gap + shareBar.h : 0);
    return { kind: "row", h, section, stats, colW, isUnder };
}

// The column's blocks top down; the spare height goes to the gaps only.
function columnBlocks(host, screen, columnW) {
    const blocks = [];
    screen.sections.forEach((section, index) => {
        if (index > 0) blocks.push({ kind: "gap", h: LOOK.sectionGap, isSpread: true });
        blocks.push({ kind: "title", h: LOOK.titleH, section, isFirst: index === 0 });
        section.rows.forEach((stats, rowIndex) => {
            if (rowIndex > 0) blocks.push({ kind: "gap", h: LOOK.rowGap, isSpread: true });
            blocks.push(rowBlock(host, section, stats, columnW));
        });
    });
    return blocks;
}

const playerLevelBlockH = () => {
    const look = LOOK.playerLevel;
    return look.titleH + look.digitsH + look.barH + look.barGap + look.pointsH;
};

const collectionBlockH = () => LOOK.collection.titleH + LOOK.collection.h;

function cardHeight(screen, avatar) {
    const { button } = LOOK;
    const buttonsH = screen.buttons.length * (button.h + button.gap) - button.gap;
    const blocksH = playerLevelBlockH() + LOOK.ruleH + collectionBlockH();
    return LOOK.cardInset + avatar + LOOK.avatarGap + LOOK.nameH + blocksH + LOOK.buttonsGap + buttonsH + LOOK.cardInset;
}

// The panel, the card and the column in a window referenceWidth wide; the
// panel is as tall as the taller of the card and the column.
function geometry(host, referenceWidth, screen) {
    const w = Math.min(Math.round(referenceWidth * LOOK.widthShare), LOOK.maxWidth);
    const innerW = w - 2 * LOOK.pad;
    const cardW = Math.round(innerW * LOOK.cardShare);
    const contentW = cardW - 2 * LOOK.cardInset;
    const avatar = Math.min(contentW, LOOK.avatar);
    const columnX = LOOK.pad + cardW + LOOK.columnGap;
    const columnW = w - LOOK.pad - columnX;
    const blocks = columnBlocks(host, screen, columnW);
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
export function drawBackdrop(host, dc, size, referenceWidth, screen) {
    drawPanelBackdrop(dc, size, REFERENCE_HEIGHT, geometry(host, referenceWidth, screen).panel);
}

// A bar on its track, filled to share (0 to 1).
function drawBar(dc, x, y, w, h, share, color) {
    dc.fillRect(x, y, w, h, COLORS.track);
    const filled = Math.round(w * Math.max(0, Math.min(1, share)));
    if (filled > 0) dc.fillRect(x, y, filled, h, color);
}

// The Player Level: its title, the level in big digits, the bar toward the
// next level and the points, centred in the card (cardX, cardW), from y.
function drawPlayerLevel(host, dc, playerLevel, cardX, cardW, contentX, contentW, y) {
    const look = LOOK.playerLevel;
    text(host, dc, playerLevel.title, { x: cardX, y, width: cardW, size: look.titleSize, weight: 700, color: COLORS.description, font: FONTS.display, align: "center" });
    const digitsY = y + look.titleH;
    text(host, dc, playerLevel.number, { x: cardX, y: digitsY - look.digitsLift, width: cardW, size: look.digitsSize, weight: 700, color: COLORS.playerLevel, font: FONTS.display, align: "center" });
    const barY = digitsY + look.digitsH;
    drawBar(dc, contentX, barY, contentW, look.barH, playerLevel.share, COLORS.playerLevel);
    text(host, dc, playerLevel.current, { x: cardX, y: barY + look.barH + look.barGap, width: cardW, size: look.pointsSize, weight: 600, color: COLORS.description, align: "center" });
}

// The Collection Mastery as the Mastery Bar shows it, stacked to fit the
// card: the goal, the bar in the tier's metal with the current count under
// its end, the Collection Tier square on the right. collection: { tier,
// reached, needed, goal, current }, current null at the last tier, whose
// bar is full. At tier 0 the bar and square take level 1's metal, so the
// block is never dull, and the goal is grey.
function drawCollection(host, dc, collection, x, y, w) {
    const look = LOOK.collection;
    const { tier, reached, needed } = collection;
    const lookLevel = Math.max(1, tier);
    dc.fillRect(x, y, w, look.h, COLORS.panelTranslucent);
    dc.frameRect(x, y, w, look.h, 1, COLORS.border);
    const size = masterySquareSize(look.squareK);
    const squareX = x + w - look.squareInset - size;
    const left = x + look.inset;
    const barW = squareX - look.barGap - left;
    oneLine(host, dc, collection.goal, { x: left, y: y + look.goalY, width: barW, size: look.goalSize, minSize: look.minGoalSize, weight: 600, color: tier > 0 ? metalOf(tier) : COLORS.description });
    drawBar(dc, left, y + look.barY, barW, look.barH, tier >= MAX_MASTERY_LEVEL ? 1 : reached / needed, tierMetalOf(tierOf(lookLevel)));
    if (collection.current !== null) oneLine(host, dc, collection.current, { x: left, y: y + look.currentY, width: barW, size: look.currentSize, weight: 600, color: COLORS.description, align: "right" });
    drawMasterySquare(host, dc, tier, squareX, y + Math.round((look.h - size) / 2), look.squareK, lookLevel);
}

// A rounded pill holding pill.text, its left edge at x, from y; gold when lit.
function drawPill(host, dc, { text: str, isLit }, x, y) {
    const look = LOOK.pill;
    const w = pillWidth(host, str);
    fillRounded(dc, x, y, w, look.h, look.h / 2, isLit ? mix(COLORS.gold, COLORS.panel, look.litMix) : COLORS.track);
    oneLine(host, dc, str, { x: x + look.padX, y, width: w - 2 * look.padX, height: look.h, size: look.size, weight: look.weight, color: isLit ? COLORS.gold : COLORS.description });
}

// A stat: its label over its value, its pill beside or under the value,
// and its thin gold bar at the bottom.
function drawStat(host, dc, stat, x, y, block) {
    const { pill, shareBar } = LOOK;
    oneLine(host, dc, stat.label, { x, y, width: block.colW, size: LOOK.labelSize, minSize: LOOK.minLabelSize, weight: 400, color: COLORS.description });
    const valueW = oneLine(host, dc, stat.value, { x, y: y + LOOK.valueY, width: block.colW, size: LOOK.valueSize, minSize: LOOK.minValueSize, weight: 700, font: FONTS.display });
    const underY = y + LOOK.rowH + pill.underGap;
    if (stat.pill && block.isUnder) drawPill(host, dc, stat.pill, x, underY);
    else if (stat.pill) drawPill(host, dc, stat.pill, Math.round(x + valueW + pill.gap), y + LOOK.valueY + Math.round((LOOK.rowH - LOOK.valueY - pill.h) / 2));
    if (stat.share !== undefined) {
        const barY = (block.isUnder ? underY + pill.h : y + LOOK.rowH) + shareBar.gap;
        drawBar(dc, x, barY, block.colW - shareBar.inset, shareBar.h, stat.share, COLORS.gold);
    }
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
            block.stats.forEach((stat, index) => drawStat(host, dc, stat, index * (block.colW + LOOK.statGap), y, block));
        }
    }
}

// screen: { name, avatarPath, playerLevel ({ title, number, share (0 to 1),
// current }), collectionTitle, collection (as drawCollection's), buttons (each { choice, label, count: null
// or a string }), sections (each { title, rows: [[{ label, value, pill
// (optional { text, isLit }), share (optional, 0 to 1: a thin gold bar) }]] }),
// closeLabel }. Returns the pieces, each { zIndex, rect, draw(dc) } drawn
// in its rect's own coordinates, and the highlight of each choice.
export function layoutProfileStats(host, screen, referenceWidth) {
    const { panel, innerH, cardW, contentW, avatar, columnX, columnW, blocks } = geometry(host, referenceWidth, screen);
    const top = panel.y + LOOK.pad;
    const cardX = panel.x + LOOK.pad;
    // Wider than the card by its glow, on every side.
    const G = LOOK.cardGlow;
    const pieces = [{
        zIndex: PROFILE_STATS_Z_INDEX.card,
        rect: { x: cardX - G, y: top - G, w: cardW + 2 * G, h: innerH + 2 * G },
        draw: dc => {
            fillGradient(dc, G, G, cardW, innerH, COLORS.panelTop, COLORS.tile);
            glow(dc, G, G, cardW, innerH, COLORS.playerLevel, G, LOOK.cardGlowPeak);
            dc.frameRect(G, G, cardW, innerH, 2, COLORS.playerLevel);
            const contentX = G + LOOK.cardInset;
            let y = G + LOOK.cardInset;
            drawAvatar(dc, screen.avatarPath, G + Math.round((cardW - avatar) / 2), y, avatar);
            y += avatar + LOOK.avatarGap;
            oneLine(host, dc, screen.name, {
                x: contentX, y, width: contentW, height: LOOK.nameH,
                size: LOOK.nameSize, minSize: LOOK.minNameSize, weight: 700, color: COLORS.gold, font: FONTS.display, align: "center",
            });
            y += LOOK.nameH;
            drawPlayerLevel(host, dc, screen.playerLevel, G, cardW, contentX, contentW, y);
            y += playerLevelBlockH();
            dc.fillRect(contentX, y, contentW, 1, COLORS.border);
            y += LOOK.ruleH;
            const collection = LOOK.collection;
            text(host, dc, screen.collectionTitle, { x: G, y, width: cardW, size: collection.titleSize, weight: 700, color: COLORS.gold, font: FONTS.display, align: "center" });
            drawCollection(host, dc, screen.collection, contentX, y + collection.titleH, contentW);
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
