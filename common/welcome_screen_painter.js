// ============================================================
// Welcome Screen painter: the layout and drawing of the Welcome Screen's
// pieces, in reference pixels (the window's height is REFERENCE_HEIGHT),
// from the prototype validated on the cabinet: the dimmed backdrop with
// the centred Steamball panel, the header (Avatar with its Player Level
// pip, close cross, greeting
// with the Profile's name in gold, Collection Mastery on the Mastery Bar's
// card), one card per Period Table (logo, period, name on one line, Table
// Mastery card around the Mastery Bar's square, grey line, "Go" button),
// the bottom row ("stay" and "random") and one highlight per choice (a
// gold halo, with a tooltip for the Avatar and the cross). Only drawing:
// no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";
import { metalOf, tierMetalOf, tierOf, MASTERY_STEPS, MAX_MASTERY_LEVEL } from "./table_mastery.js";
import {
    text, oneLine, fillGradient, drawAvatar, drawLevelPip, drawCross, tooltip, selectionHalo, drawBackdrop as drawPanelBackdrop, drawWheelLogo,
} from "./steamball_drawing.js";
import { drawMasterySquare, masterySquareSize } from "./mastery_square.js";

// Above the Achievement List (6000 to 6006), under the toasts and the
// Profile picker. Exported for the tests' reader.
export const WELCOME_SCREEN_Z_INDEX = Object.freeze({ backdrop: 6100, header: 6101, rows: 6102, cards: 6103, logos: 6104, collection: 6105, highlights: 6110 });

export const REFERENCE_HEIGHT = 1920;

export const CHOICE = Object.freeze({ AVATAR: "avatar", CLOSE: "close", DAY: "day", WEEK: "week", STAY: "stay", RANDOM: "random" });


const LOOK = Object.freeze({
    pad: 40, gap: 26,
    avatar: 120, cross: 56,
    // The level pip straddles the Avatar's bottom-right corner, in the
    // Profile badge's proportions.
    pipSize: 42, pipInset: 8,
    greetingSize: 34, greetingGap: 36, greetingBottom: 44, headerBottom: 22,
    rowH: 90, rowSize: 21, rowIcon: 60,
    // A Period Table card, from its top: period, name, Mastery card (the
    // Mastery Bar's, scaled by cardK), then the grey line, if any.
    cardTop: 30, nameY: 78, masteryY: 134, lineGap: 18, lineH: 34, cardBottom: 34,
    periodSize: 21, nameSize: 22, minNameSize: 18, lineSize: 18, minLineSize: 15, lineTile: 28,
    cardK: 0.95, masteryCardH: 74,
    button: Object.freeze({ w: 140, h: 52, size: 22 }),
    // The logo column, narrower inside a window under narrowBelow (a
    // portrait playfield), then the details at most detailsMaxW wide.
    logoInset: 24, logoTop: 20, logoW: 360, narrowLogoShare: 0.26, narrowBelow: 1300, detailsGap: 32, detailsMaxW: 640,
    // The panel's width: a share of the window's, at most maxWidth.
    widthShare: 0.9, maxWidth: 1800,
    // Room around a highlighted element for its halo, and beside the
    // Avatar and the cross for their tooltip.
    haloMargin: 20, avatarTooltipRoom: 380, crossTooltipRoom: 240,
    // Room around the Collection Mastery card for its square's halo.
    squareHaloMargin: 24,
});

// ---------- Small drawing helpers ----------

// Several runs on one line, each with its own colour.
function runs(host, dc, parts, { x, y, width, size, weight = 700, font = FONTS.display }) {
    const styled = host.createStyledText({ textAlign: "left", textStyle: { font, size, weight, color: COLORS.title } });
    for (const [str, color] of parts) styled.add({ font, size, weight, color, text: str });
    const measured = styled.measure(width).height;
    styled.draw(dc, { x, y, width, height: measured });
}

// A thick check mark, as stacked squares along its two strokes.
function drawCheck(dc, x, y, size, color) {
    const t = Math.max(3, Math.round(size / 7));
    for (let i = 0; i <= size * 0.35; i++) dc.fillRect(Math.round(x + i), Math.round(y + size * 0.5 + i), t, t, color);
    for (let i = 0; i <= size * 0.65; i++) dc.fillRect(Math.round(x + size * 0.35 + i), Math.round(y + size * 0.85 - i * 1.15), t, t, color);
}

// The grey line: the check mark, or the Streak's count, in a small square
// like the go-back arrow's, then its text.
function drawGreyLine(host, dc, line, x, y, w) {
    const tile = LOOK.lineTile;
    const top = y + 2;
    fillGradient(dc, x, top, tile, tile, COLORS.rowUnlocked, COLORS.tile);
    dc.frameRect(x, top, tile, tile, 2, COLORS.border);
    if (line.played) drawCheck(dc, x + 6, top + 5, 15, COLORS.description);
    else text(host, dc, String(line.streak), { x, y: top, width: tile, height: tile, size: line.streak > 99 ? 11 : 14, weight: 700, color: COLORS.description, font: FONTS.display, align: "center" });
    oneLine(host, dc, line.text, { x: x + tile + 12, y: top, width: w - tile - 12, height: tile, size: LOOK.lineSize, minSize: LOOK.minLineSize, color: COLORS.description });
}

// ---------- Mastery cards ----------

// The wheel's Mastery Bar card, w wide, its heights and type scaled by
// cardK: translucent panel, head, an optional count on its right, bar
// filled to share (0 to 1), and the Mastery Bar's own square at the bar's
// end, whose halo spills out of the panel; the square shows level, in
// lookLevel's metal.
function drawMasteryCard(host, dc, x, y, w, { head, headColor, count = null, share, fillColor, level, lookLevel = level }) {
    const scaled = value => Math.round(value * LOOK.cardK);
    const cardH = scaled(LOOK.masteryCardH);
    dc.fillRect(x, y, w, cardH, COLORS.panelTranslucent);
    dc.frameRect(x, y, w, cardH, 1, COLORS.border);
    const size = masterySquareSize(LOOK.cardK);
    const squareX = x + w - scaled(14) - size;
    const barX = x + scaled(18);
    const barW = squareX - scaled(26) - barX;
    text(host, dc, head, { x: barX, y: y + scaled(13), width: barW, size: scaled(13), weight: 600, color: headColor });
    // Right-aligned with the bar's end.
    if (count !== null) text(host, dc, count, { x: barX, y: y + scaled(13), width: barW, size: scaled(13), weight: 600, color: COLORS.description, align: "right" });
    dc.fillRect(barX, y + scaled(46), barW, scaled(10), COLORS.track);
    const filled = Math.round(barW * Math.min(1, share));
    if (filled > 0) dc.fillRect(barX, y + scaled(46), filled, scaled(10), fillColor);
    drawMasterySquare(host, dc, level, squareX, y + Math.round((cardH - size) / 2), LOOK.cardK, lookLevel);
}

// mastery: masteryOf()'s { level, step }, null for a table never played;
// head: { text, color }.
function drawTableMasteryCard(host, dc, mastery, head, x, y, w) {
    const level = mastery ? mastery.level : 0;
    drawMasteryCard(host, dc, x, y, w, {
        head: head.text, headColor: head.color, share: mastery ? mastery.step / MASTERY_STEPS : 0,
        fillColor: tierMetalOf(tierOf(Math.max(1, level))), level,
    });
}

// collection: { tier, reached, needed, goal, current }, current null at
// the last tier, whose bar is full. At tier 0 the bar and square take
// level 1's metal, so the card is never dull.
function drawCollectionCard(host, dc, collection, x, y, w) {
    const { tier, reached, needed } = collection;
    const lookLevel = Math.max(1, tier);
    drawMasteryCard(host, dc, x, y, w, {
        head: collection.goal, headColor: tier > 0 ? metalOf(tier) : COLORS.description, count: collection.current,
        share: tier >= MAX_MASTERY_LEVEL ? 1 : reached / needed,
        fillColor: tierMetalOf(tierOf(lookLevel)), level: tier, lookLevel,
    });
}

// ---------- Bottom row icons, drawn in a size x size box ----------

// The square the "go back" arrow sits in, like the mystery box.
function iconTile(dc, x, y, size) {
    const inset = Math.round(size * 0.12);
    fillGradient(dc, x + inset, y + inset, size - 2 * inset, size - 2 * inset, COLORS.rowUnlocked, COLORS.tile);
    dc.frameRect(x + inset, y + inset, size - 2 * inset, size - 2 * inset, 2, COLORS.border);
}

// A "go back" arrow: a left-pointing head on the lower stroke, hooked up
// on the right into a short upper stroke, like the ↩ glyph.
function iconBack(dc, x, y, size) {
    const color = COLORS.gold;
    const t = Math.max(4, Math.round(size * 0.1));
    const cx = Math.round(x + size * 0.62);
    const cy = Math.round(y + size * 0.42);
    const outerRadius = Math.round(size * 0.2);
    const innerRadius = outerRadius - t;
    for (let dy = -outerRadius; dy < outerRadius; dy++) {
        const yy = dy + 0.5;
        const outer = Math.sqrt(outerRadius * outerRadius - yy * yy);
        const inner = Math.abs(yy) < innerRadius ? Math.sqrt(innerRadius * innerRadius - yy * yy) : 0;
        dc.fillRect(Math.round(cx + inner), cy + dy, Math.max(1, Math.round(outer - inner)), 1, color);
    }
    dc.fillRect(Math.round(x + size * 0.45), cy - outerRadius, cx - Math.round(x + size * 0.45), t, color);
    const tipX = Math.round(x + size * 0.14);
    const midY = cy + outerRadius - Math.round(t / 2);
    const headL = Math.round(size * 0.22);
    const headH = Math.round(size * 0.17);
    dc.fillRect(tipX + Math.round(headL * 0.6), cy + outerRadius - t, cx - tipX - Math.round(headL * 0.6), t, color);
    for (let i = 0; i <= headL; i++) {
        const half = Math.round(headH * i / headL);
        dc.fillRect(tipX + i, midY - half, 1, 2 * half + 1, color);
    }
}

// A mystery box: a bevelled crate with a gold "?".
function iconBox(host, dc, x, y, size) {
    const left = Math.round(x + size * 0.18);
    const top = Math.round(y + size * 0.18);
    const s = Math.round(size * 0.64);
    const b = Math.max(3, Math.round(s / 10));
    dc.fillRect(left, top, s, s, 0xFF8A5A2B);
    dc.fillRect(left, top, s, b, 0xFFC08040);
    dc.fillRect(left, top, b, s, 0xFFB07038);
    dc.fillRect(left, top + s - b, s, b, 0xFF4A2E14);
    dc.fillRect(left + s - b, top, b, s, 0xFF5A3818);
    dc.frameRect(left, top, s, s, 2, 0xFF2A1A0A);
    text(host, dc, "?", { x: left, y: top, width: s, height: s, size: Math.round(s * 0.62), weight: 700, color: COLORS.gold, font: FONTS.display, align: "center" });
}

// ---------- Layout ----------

// The panel and its inner column in a window referenceWidth wide.
function geometry(referenceWidth, screen) {
    const w = Math.min(Math.round(referenceWidth * LOOK.widthShare), LOOK.maxWidth);
    const inner = { x: Math.round((referenceWidth - w) / 2) + LOOK.pad, w: w - 2 * LOOK.pad };
    // Under the Avatar; without one, on the top line, beside the cross.
    const greetingY = screen.picker ? LOOK.avatar + LOOK.greetingGap : 0;
    const collectionY = greetingY + Math.round(LOOK.greetingSize * 1.4) + LOOK.greetingBottom;
    const masteryCardH = Math.round(LOOK.masteryCardH * LOOK.cardK);
    const headerH = collectionY + masteryCardH + LOOK.headerBottom;
    // Each card ends under its Mastery card, or under its grey line.
    const masteryBottom = LOOK.masteryY + masteryCardH;
    const lineY = masteryBottom + LOOK.lineGap;
    const cardHs = screen.cards.map(card => (card.line ? lineY + LOOK.lineH : masteryBottom) + LOOK.cardBottom);
    const cardsH = cardHs.reduce((sum, cardH) => sum + cardH + LOOK.gap, 0);
    const logoW = inner.w < LOOK.narrowBelow ? Math.round(inner.w * LOOK.narrowLogoShare) : LOOK.logoW;
    // Where a card's details start, which Collection Mastery lines up with.
    const detailsX = LOOK.logoInset + logoW + LOOK.detailsGap;
    const h = LOOK.pad + headerH + LOOK.gap + cardsH + LOOK.rowH + LOOK.pad;
    const panel = { x: inner.x - LOOK.pad, y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    return { panel, inner, headerH, greetingY, collectionY, masteryCardH, cardHs, cardsH, lineY, logoW, detailsX };
}

// The backdrop: the dimmed wheel and the panel, drawn on a window-sized
// canvas whose height is REFERENCE_HEIGHT * scale.
export function drawBackdrop(dc, size, referenceWidth, screen) {
    drawPanelBackdrop(dc, size, REFERENCE_HEIGHT, geometry(referenceWidth, screen).panel);
}

// The Period Table cards, top to bottom, each with the highlight of its
// "Go" button.
function layoutCards(host, screen, { inner, cardHs, lineY, logoW, detailsX, masteryCardH }, cardsTop, haloAround) {
    const { button } = LOOK;
    // Centred on the Mastery card's height.
    const buttonRect = { ...button, x: inner.w - LOOK.logoInset - button.w, y: LOOK.masteryY + Math.round((masteryCardH - button.h) / 2) };
    const detailsW = Math.min(buttonRect.x - LOOK.detailsGap - detailsX, LOOK.detailsMaxW);
    const pieces = [];
    const highlights = {};
    let cardY = cardsTop;
    screen.cards.forEach((card, index) => {
        const cardH = cardHs[index];
        pieces.push({
            zIndex: WELCOME_SCREEN_Z_INDEX.cards,
            rect: { x: inner.x, y: cardY, w: inner.w, h: cardH },
            draw: dc => {
                fillGradient(dc, 0, 0, inner.w, cardH, COLORS.panelTop, COLORS.panel);
                dc.frameRect(0, 0, inner.w, cardH, 1, COLORS.border);
                text(host, dc, card.period, { x: detailsX, y: LOOK.cardTop, width: detailsW, size: LOOK.periodSize, weight: 700, color: COLORS.gold, font: FONTS.display });
                oneLine(host, dc, card.title, { x: detailsX, y: LOOK.nameY, width: detailsW, size: LOOK.nameSize, minSize: LOOK.minNameSize });
                drawTableMasteryCard(host, dc, card.mastery, card.masteryHead, detailsX, LOOK.masteryY, detailsW);
                if (card.line) drawGreyLine(host, dc, card.line, detailsX, lineY, detailsW);
                fillGradient(dc, buttonRect.x, buttonRect.y, button.w, button.h, COLORS.rowUnlocked, COLORS.tile);
                dc.frameRect(buttonRect.x, buttonRect.y, button.w, button.h, 1, COLORS.border);
                text(host, dc, card.goLabel, { x: buttonRect.x, y: buttonRect.y, width: button.w, height: button.h, size: button.size, weight: 700, font: FONTS.display, align: "center" });
            },
        });
        // On a layer of its own, above the card's.
        const logoH = cardH - 2 * LOOK.logoTop;
        pieces.push({
            zIndex: WELCOME_SCREEN_Z_INDEX.logos,
            rect: { x: inner.x + LOOK.logoInset, y: cardY + LOOK.logoTop, w: logoW, h: logoH },
            draw: dc => drawWheelLogo(host, dc, card, { x: 0, y: 0, w: logoW, h: logoH }, 30),
        });
        highlights[card.choice] = haloAround({ x: inner.x + buttonRect.x, y: cardY + buttonRect.y, w: button.w, h: button.h });
        cardY += cardH + LOOK.gap;
    });
    return { pieces, highlights };
}

// screen: { picker, avatarPath, level (the shown Player Level, null for
// no pip), greeting (runs of [text, gold?]),
// collection ({ tier, reached, needed, goal, current }), cards
// (each { choice, period, title, logoPath, mastery, masteryHead ({ text,
// color }, as the Mastery Bar's), line
// (null, or { played, streak, text }), goLabel }), choices, labels (by
// choice) }. Returns the pieces, each { zIndex, rect, draw(dc) } drawn in
// its rect's own coordinates, and the highlight of each choice.
export function layoutWelcomeScreen(host, screen, referenceWidth) {
    const layout = geometry(referenceWidth, screen);
    const { inner, headerH, greetingY, collectionY, masteryCardH, detailsX, panel, cardsH } = layout;
    const top = panel.y + LOOK.pad;
    const pieces = [{
        zIndex: WELCOME_SCREEN_Z_INDEX.header,
        rect: { x: inner.x, y: top, w: inner.w, h: headerH },
        draw: dc => {
            if (screen.picker) {
                drawAvatar(dc, screen.avatarPath, 0, 0, LOOK.avatar);
                const corner = LOOK.avatar - LOOK.pipInset;
                if (screen.level !== null) drawLevelPip(host, dc, screen.level, corner, corner, LOOK.pipSize);
            }
            drawCross(dc, inner.w - LOOK.cross, 0, LOOK.cross);
            const parts = screen.greeting.map(([str, gold]) => [str, gold ? COLORS.gold : COLORS.title]);
            runs(host, dc, parts, { x: 0, y: greetingY, width: inner.w - LOOK.cross - 40, size: LOOK.greetingSize });
        },
    }];
    // From the card details' left edge to the right edge, on a layer of its
    // own with room for its square's halo.
    const squareRoom = LOOK.squareHaloMargin;
    const collectionW = inner.w - detailsX;
    pieces.push({
        zIndex: WELCOME_SCREEN_Z_INDEX.collection,
        rect: { x: inner.x + detailsX - squareRoom, y: top + collectionY - squareRoom, w: collectionW + 2 * squareRoom, h: masteryCardH + 2 * squareRoom },
        draw: dc => drawCollectionCard(host, dc, screen.collection, squareRoom, squareRoom, collectionW),
    });

    const M = LOOK.haloMargin;
    const highlightPiece = (rect, draw) => ({ zIndex: WELCOME_SCREEN_Z_INDEX.highlights, rect, draw });
    const haloAround = rect => highlightPiece(
        { x: rect.x - M, y: rect.y - M, w: rect.w + 2 * M, h: rect.h + 2 * M },
        dc => selectionHalo(dc, M, M, rect.w, rect.h)
    );

    const cardsTop = top + headerH + LOOK.gap;
    const cards = layoutCards(host, screen, layout, cardsTop, haloAround);
    pieces.push(...cards.pieces);

    // "stay" and "random", side by side.
    const rowsTop = cardsTop + cardsH;
    const rowW = Math.round((inner.w - LOOK.gap) / 2);
    const rowRect = {
        [CHOICE.STAY]: { x: inner.x, y: rowsTop, w: rowW, h: LOOK.rowH },
        [CHOICE.RANDOM]: { x: inner.x + rowW + LOOK.gap, y: rowsTop, w: rowW, h: LOOK.rowH },
    };
    pieces.push({
        zIndex: WELCOME_SCREEN_Z_INDEX.rows,
        rect: { x: inner.x, y: rowsTop, w: inner.w, h: LOOK.rowH },
        draw: dc => {
            for (const choice of [CHOICE.STAY, CHOICE.RANDOM]) {
                const r = rowRect[choice];
                const x = r.x - inner.x;
                fillGradient(dc, x, 0, r.w, r.h, COLORS.rowUnlocked, COLORS.tile);
                dc.frameRect(x, 0, r.w, r.h, 1, COLORS.border);
                const iconY = Math.round((r.h - LOOK.rowIcon) / 2);
                if (choice === CHOICE.STAY) {
                    iconTile(dc, x + 16, iconY, LOOK.rowIcon);
                    const arrow = Math.round(LOOK.rowIcon * 0.7);
                    const offset = Math.round((LOOK.rowIcon - arrow) / 2);
                    iconBack(dc, x + 16 + offset, iconY + offset, arrow);
                } else {
                    iconBox(host, dc, x + 16, iconY, LOOK.rowIcon);
                }
                text(host, dc, screen.labels[choice], { x: x + LOOK.rowIcon + 36, y: 0, width: r.w - LOOK.rowIcon - 56, height: r.h, size: LOOK.rowSize, weight: 600 });
            }
        },
    });

    const highlights = {
        ...cards.highlights,
        [CHOICE.STAY]: haloAround(rowRect[CHOICE.STAY]),
        [CHOICE.RANDOM]: haloAround(rowRect[CHOICE.RANDOM]),
    };
    // The cross's tooltip sits on its left, the Avatar's on its right,
    // where the header is empty; their rects leave room for it.
    const crossX = inner.x + inner.w - LOOK.cross;
    const crossRoom = LOOK.crossTooltipRoom;
    highlights[CHOICE.CLOSE] = highlightPiece(
        { x: crossX - crossRoom, y: top - M, w: crossRoom + LOOK.cross + M, h: LOOK.cross + 2 * M },
        dc => {
            selectionHalo(dc, crossRoom, M, LOOK.cross, LOOK.cross);
            tooltip(host, dc, screen.labels[CHOICE.CLOSE], crossRoom - 18, M + LOOK.cross / 2, "left");
        }
    );
    if (screen.picker) {
        const room = LOOK.avatarTooltipRoom;
        highlights[CHOICE.AVATAR] = highlightPiece(
            { x: inner.x - M, y: top - M, w: M + LOOK.avatar + room, h: LOOK.avatar + 2 * M },
            dc => {
                selectionHalo(dc, M, M, LOOK.avatar, LOOK.avatar);
                tooltip(host, dc, screen.labels[CHOICE.AVATAR], M + LOOK.avatar + 18, M + LOOK.avatar / 2, "right");
            }
        );
    }
    return { pieces, highlights };
}
