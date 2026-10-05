// ============================================================
// Welcome Screen painter: the layout and drawing of the Welcome Screen's
// pieces, in reference pixels (the window's height is REFERENCE_HEIGHT),
// from the prototype validated on the cabinet: the dimmed backdrop with
// the centred Steamball panel, the header (Avatar, close cross, greeting
// with the Profile's name in gold), one card per Period Table (logo,
// period, name on one line, Table Mastery card around the Mastery Bar's
// square, grey line, "Go" button),
// the bottom row ("stay" and "random") and one highlight per choice (a
// gold halo, with a tooltip for the Avatar and the cross). Only drawing:
// no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";
import { mix, withAlpha, tierMetalOf, tierOf, MASTERY_STEPS, WHITE } from "./table_mastery.js";
import { drawMasterySquare, masterySquareSize } from "./mastery_square.js";

// Above the Achievement List (6000 to 6006), under the toasts and the
// Profile picker. Exported for the tests' reader.
export const WELCOME_SCREEN_Z_INDEX = Object.freeze({ backdrop: 6100, header: 6101, rows: 6102, cards: 6103, logos: 6104, highlights: 6110 });

export const REFERENCE_HEIGHT = 1920;

export const CHOICE = Object.freeze({ AVATAR: "avatar", CLOSE: "close", DAY: "day", WEEK: "week", STAY: "stay", RANDOM: "random" });

const OVERLAY = 0xD0080A0E;
const TOOLTIP = Object.freeze({ color: 0xFF0C0C0E, size: 22, weight: 400, height: 52, padX: 28, radius: 6, arrow: 10 });

const LOOK = Object.freeze({
    pad: 40, gap: 26,
    avatar: 120, cross: 56,
    greetingSize: 34, greetingGap: 36, greetingBottom: 44,
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
});

// ---------- Small drawing helpers ----------

function text(host, dc, str, { x, y, width, height, size, weight = 400, color = COLORS.title, font = FONTS.body, align = "left" }) {
    const styled = host.createStyledText({ textAlign: align, textStyle: { font, size, weight, color } });
    styled.add(str);
    const measured = styled.measure(width).height;
    const top = height === undefined ? y : y + (height - measured) / 2;
    styled.draw(dc, { x, y: top, width, height: measured });
}

// One line of text in width: the size goes down to minSize, then the end
// gives way to "…".
function oneLine(host, dc, str, { x, y, width, height, size, minSize = size, weight = 600, color = COLORS.title, font = FONTS.body }) {
    const styledAt = (candidate, fontSize) => {
        const styled = host.createStyledText({ textAlign: "left", textStyle: { font, size: fontSize, weight, color } });
        styled.add(candidate);
        return styled;
    };
    // Measured unbounded: within width, it would wrap instead.
    const fits = styled => styled.measure(100000).width <= width;
    let fontSize = size;
    let styled = styledAt(str, fontSize);
    while (!fits(styled) && fontSize > minSize) styled = styledAt(str, --fontSize);
    for (let cut = str.length - 1; !fits(styled) && cut > 1; cut--) styled = styledAt(`${str.slice(0, cut).trimEnd()}…`, fontSize);
    const measured = styled.measure(100000).height;
    // A little wider than measured, so the line never wraps on rounding.
    styled.draw(dc, { x, y: height === undefined ? y : y + (height - measured) / 2, width: width + 4, height: measured });
}

// Several runs on one line, each with its own colour.
function runs(host, dc, parts, { x, y, width, size, weight = 700, font = FONTS.display }) {
    const styled = host.createStyledText({ textAlign: "left", textStyle: { font, size, weight, color: COLORS.title } });
    for (const [str, color] of parts) styled.add({ font, size, weight, color, text: str });
    const measured = styled.measure(width).height;
    styled.draw(dc, { x, y, width, height: measured });
}

function fillDisc(dc, cx, cy, r, color) {
    for (let dy = -r; dy < r; dy++) {
        const half = Math.round(Math.sqrt(r * r - (dy + 0.5) * (dy + 0.5)));
        dc.fillRect(Math.round(cx - half), Math.round(cy + dy), 2 * half, 1, color);
    }
}

function fillRounded(dc, x, y, w, h, r, color) {
    dc.fillRect(x + r, y, w - 2 * r, h, color);
    dc.fillRect(x, y + r, r, h - 2 * r, color);
    dc.fillRect(x + w - r, y + r, r, h - 2 * r, color);
    for (const [cx, cy] of [[x + r, y + r], [x + w - r, y + r], [x + r, y + h - r], [x + w - r, y + h - r]]) fillDisc(dc, cx, cy, r, color);
}

// In 4-pixel bands: the drawing context has no gradient fill.
function fillGradient(dc, x, y, w, h, top, bottom) {
    for (let row = 0; row < h; row += 4) dc.fillRect(x, y + row, w, Math.min(4, h - row), mix(top, bottom, row / Math.max(1, h - 1)));
}

function glow(dc, x, y, w, h, color, rings, peak) {
    for (let ring = rings; ring >= 1; ring--) {
        dc.frameRect(x - ring, y - ring, w + 2 * ring, h + 2 * ring, 1, withAlpha(color, Math.round(peak * (1 - ring / (rings + 1)))));
    }
}

function drawAvatar(dc, path, x, y, size) {
    dc.fillRect(x, y, size, size, COLORS.tile);
    if (path) dc.drawImage(path, x + 3, y + 3, size - 6, size - 6);
    dc.frameRect(x, y, size, size, 3, COLORS.border);
}

// The close cross on a small tile.
function drawCross(dc, x, y, size) {
    fillGradient(dc, x, y, size, size, COLORS.rowUnlocked, COLORS.tile);
    dc.frameRect(x, y, size, size, 2, COLORS.border);
    const inset = Math.round(size * 0.3);
    const t = Math.max(3, Math.round(size / 14));
    for (let i = 0; i <= size - 2 * inset; i++) {
        dc.fillRect(x + inset + i - 1, y + inset + i - 1, t, t, COLORS.description);
        dc.fillRect(x + size - inset - i - t + 1, y + inset + i - 1, t, t, COLORS.description);
    }
}

// A wheel logo fitted in the box, its aspect kept; the title when it has none.
function drawLogo(host, dc, card, w, h) {
    const size = card.logoPath ? dc.getImageSize(card.logoPath) : null;
    if (size && size.width > 0 && size.height > 0) {
        const scale = Math.min(w / size.width, h / size.height);
        const dw = Math.round(size.width * scale);
        const dh = Math.round(size.height * scale);
        dc.drawImage(card.logoPath, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
        return;
    }
    text(host, dc, card.title, { x: 0, y: 0, width: w, height: h, size: 30, weight: 700, font: FONTS.display, align: "center" });
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

// ---------- Mastery card ----------

// The wheel's Mastery Bar card, w wide, its heights and type scaled by
// cardK: translucent panel, head in the level's metal, bar, and the
// Mastery Bar's own square at the bar's end, whose halo spills out of the
// panel. mastery: masteryOf()'s { level, step }, null for a table never
// played; head: { text, color }.
function drawTableMasteryCard(host, dc, mastery, head, x, y, w) {
    const scaled = value => Math.round(value * LOOK.cardK);
    const cardH = scaled(LOOK.masteryCardH);
    const level = mastery ? mastery.level : 0;
    dc.fillRect(x, y, w, cardH, COLORS.panelTranslucent);
    dc.frameRect(x, y, w, cardH, 1, COLORS.border);
    const size = masterySquareSize(LOOK.cardK);
    const squareX = x + w - scaled(14) - size;
    const barX = x + scaled(18);
    const barW = squareX - scaled(26) - barX;
    text(host, dc, head.text, { x: barX, y: y + scaled(13), width: barW, size: scaled(13), weight: 600, color: head.color });
    dc.fillRect(barX, y + scaled(46), barW, scaled(10), COLORS.track);
    if (mastery && mastery.step > 0) {
        dc.fillRect(barX, y + scaled(46), Math.round(barW * mastery.step / MASTERY_STEPS), scaled(10), tierMetalOf(tierOf(level)));
    }
    drawMasterySquare(host, dc, level, squareX, y + Math.round((cardH - size) / 2), LOOK.cardK);
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

// ---------- Selection ----------

// A web-style tooltip: a dark rounded label with a small arrow whose tip
// is at (tipX, tipY), the label on the given side of the tip.
function tooltip(host, dc, str, tipX, tipY, side) {
    const { color, size, weight, height, padX, radius, arrow } = TOOLTIP;
    const styled = host.createStyledText({ textAlign: "center", textStyle: { font: FONTS.body, size, weight, color: WHITE } });
    styled.add(str);
    const w = Math.ceil(styled.measure(2000).width) + 2 * padX;
    const x = side === "left" ? tipX - arrow - w : tipX + arrow;
    const y = Math.round(tipY - height / 2);
    fillRounded(dc, x, y, w, height, radius, color);
    for (let i = 0; i < arrow; i++) {
        const half = arrow - i;
        if (side === "left") dc.fillRect(x + w + i, tipY - half, 1, 2 * half, color);
        else dc.fillRect(x - i - 1, tipY - half, 1, 2 * half, color);
    }
    const th = styled.measure(w).height;
    styled.draw(dc, { x, y: y + (height - th) / 2, width: w, height: th });
}

// Gold halo and frame around the selected element.
function selectionHalo(dc, x, y, w, h) {
    glow(dc, x, y, w, h, COLORS.gold, 12, 0x90);
    dc.frameRect(x, y, w, h, 4, COLORS.gold);
}

// ---------- Layout ----------

// The panel and its inner column in a window referenceWidth wide.
function geometry(referenceWidth, screen) {
    const w = Math.min(Math.round(referenceWidth * LOOK.widthShare), LOOK.maxWidth);
    const inner = { x: Math.round((referenceWidth - w) / 2) + LOOK.pad, w: w - 2 * LOOK.pad };
    // Under the Avatar; without one, on the top line, beside the cross.
    const greetingY = screen.picker ? LOOK.avatar + LOOK.greetingGap : 0;
    const headerH = greetingY + Math.round(LOOK.greetingSize * 1.4) + LOOK.greetingBottom;
    // Each card ends under its Mastery card, or under its grey line.
    const masteryBottom = LOOK.masteryY + Math.round(LOOK.masteryCardH * LOOK.cardK);
    const lineY = masteryBottom + LOOK.lineGap;
    const cardHs = screen.cards.map(card => (card.line ? lineY + LOOK.lineH : masteryBottom) + LOOK.cardBottom);
    const cardsH = cardHs.reduce((sum, cardH) => sum + cardH + LOOK.gap, 0);
    const logoW = inner.w < LOOK.narrowBelow ? Math.round(inner.w * LOOK.narrowLogoShare) : LOOK.logoW;
    const h = LOOK.pad + headerH + LOOK.gap + cardsH + LOOK.rowH + LOOK.pad;
    const panel = { x: inner.x - LOOK.pad, y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    return { panel, inner, headerH, greetingY, cardHs, cardsH, lineY, logoW };
}

// The backdrop: the dimmed wheel and the panel, drawn on a window-sized
// canvas whose height is REFERENCE_HEIGHT * scale.
export function drawBackdrop(dc, { width, height }, referenceWidth, screen) {
    const scale = height / REFERENCE_HEIGHT;
    dc.fillRect(0, 0, width, height, OVERLAY);
    const { panel } = geometry(referenceWidth, screen);
    const [x, y, w, h] = [panel.x, panel.y, panel.w, panel.h].map(value => Math.round(value * scale));
    glow(dc, x, y, w, h, COLORS.gold, 6, 0x30);
    fillGradient(dc, x, y, w, h, COLORS.panelTop, COLORS.panel);
    dc.frameRect(x, y, w, h, 1, COLORS.border);
}

// The Period Table cards, top to bottom, each with the highlight of its
// "Go" button.
function layoutCards(host, screen, { inner, cardHs, lineY, logoW }, cardsTop, haloAround) {
    const { button } = LOOK;
    // Centred on the Mastery card's height.
    const buttonRect = { ...button, x: inner.w - LOOK.logoInset - button.w, y: LOOK.masteryY + Math.round((LOOK.masteryCardH * LOOK.cardK - button.h) / 2) };
    const detailsX = LOOK.logoInset + logoW + LOOK.detailsGap;
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
            draw: dc => drawLogo(host, dc, card, logoW, logoH),
        });
        highlights[card.choice] = haloAround({ x: inner.x + buttonRect.x, y: cardY + buttonRect.y, w: button.w, h: button.h });
        cardY += cardH + LOOK.gap;
    });
    return { pieces, highlights };
}

// screen: { picker, avatarPath, greeting (runs of [text, gold?]), cards
// (each { choice, period, title, logoPath, mastery, masteryHead ({ text,
// color }, as the Mastery Bar's), line
// (null, or { played, streak, text }), goLabel }), choices, labels (by
// choice) }. Returns the pieces, each { zIndex, rect, draw(dc) } drawn in
// its rect's own coordinates, and the highlight of each choice.
export function layoutWelcomeScreen(host, screen, referenceWidth) {
    const layout = geometry(referenceWidth, screen);
    const { inner, headerH, greetingY, panel, cardsH } = layout;
    const top = panel.y + LOOK.pad;
    const pieces = [{
        zIndex: WELCOME_SCREEN_Z_INDEX.header,
        rect: { x: inner.x, y: top, w: inner.w, h: headerH },
        draw: dc => {
            if (screen.picker) drawAvatar(dc, screen.avatarPath, 0, 0, LOOK.avatar);
            drawCross(dc, inner.w - LOOK.cross, 0, LOOK.cross);
            const parts = screen.greeting.map(([str, gold]) => [str, gold ? COLORS.gold : COLORS.title]);
            runs(host, dc, parts, { x: 0, y: greetingY, width: inner.w - LOOK.cross - 40, size: LOOK.greetingSize });
        },
    }];

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
