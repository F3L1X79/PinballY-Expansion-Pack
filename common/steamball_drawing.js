// ============================================================
// Steamball drawing helpers shared by the drawn screens (Welcome Screen,
// Profile Stats) and the Profile badge: text on one or several lines, rounded and gradient
// fills, glows, the dimmed backdrop with its panel, the Avatar, a wheel
// logo, the close cross, a tooltip, the gold selection halo and the
// Player Level pip. Each draws on the drawing context it is given, in its
// coordinates. Only drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS, RANK_COLORS } from "./steamball_palette.js";
import { mix, withAlpha, WHITE } from "./table_mastery.js";
import { playerLevelMetalOf } from "./player_level.js";

const TOOLTIP = Object.freeze({ color: 0xFF0C0C0E, size: 22, weight: 400, height: 52, padX: 28, radius: 6, arrow: 10 });

// Measured unbounded: within a width, it would wrap instead.
export const UNBOUNDED = 100000;
const OVERLAY = 0xD0080A0E;

// Wraps within width, centred in height when given.
export function text(host, dc, str, { x, y, width, height, size, weight = 400, color = COLORS.title, font = FONTS.body, align = "left" }) {
    const styled = host.createStyledText({ textAlign: align, textStyle: { font, size, weight, color } });
    styled.add(str);
    const measured = styled.measure(width).height;
    const top = height === undefined ? y : y + (height - measured) / 2;
    styled.draw(dc, { x, y: top, width, height: measured });
}

// One line of text in width: the size goes down to minSize, then the end
// gives way to "…". Returns the width drawn.
export function oneLine(host, dc, str, { x, y, width, height, size, minSize = size, weight = 600, color = COLORS.title, font = FONTS.body, align = "left" }) {
    const styledAt = (candidate, fontSize) => {
        const styled = host.createStyledText({ textAlign: "left", textStyle: { font, size: fontSize, weight, color } });
        styled.add(candidate);
        return styled;
    };
    const fits = styled => styled.measure(UNBOUNDED).width <= width;
    let fontSize = size;
    let styled = styledAt(str, fontSize);
    while (!fits(styled) && fontSize > minSize) styled = styledAt(str, --fontSize);
    for (let cut = str.length - 1; !fits(styled) && cut > 1; cut--) styled = styledAt(`${str.slice(0, cut).trimEnd()}…`, fontSize);
    const measured = styled.measure(UNBOUNDED);
    const top = height === undefined ? y : y + (height - measured.height) / 2;
    // A little wider than measured, so the line never wraps on rounding.
    if (align === "left") {
        styled.draw(dc, { x, y: top, width: width + 4, height: measured.height });
    } else {
        const left = align === "right" ? x + width - measured.width : x + (width - measured.width) / 2;
        styled.draw(dc, { x: left, y: top, width: measured.width + 4, height: measured.height });
    }
    return measured.width;
}

export function fillDisc(dc, cx, cy, r, color) {
    for (let dy = -r; dy < r; dy++) {
        const half = Math.round(Math.sqrt(r * r - (dy + 0.5) * (dy + 0.5)));
        dc.fillRect(Math.round(cx - half), Math.round(cy + dy), 2 * half, 1, color);
    }
}

export function fillRounded(dc, x, y, w, h, r, color) {
    dc.fillRect(x + r, y, w - 2 * r, h, color);
    dc.fillRect(x, y + r, r, h - 2 * r, color);
    dc.fillRect(x + w - r, y + r, r, h - 2 * r, color);
    for (const [cx, cy] of [[x + r, y + r], [x + w - r, y + r], [x + r, y + h - r], [x + w - r, y + h - r]]) fillDisc(dc, cx, cy, r, color);
}

// In 4-pixel bands: the drawing context has no gradient fill.
export function fillGradient(dc, x, y, w, h, top, bottom) {
    for (let row = 0; row < h; row += 4) dc.fillRect(x, y + row, w, Math.min(4, h - row), mix(top, bottom, row / Math.max(1, h - 1)));
}

export function glow(dc, x, y, w, h, color, rings, peak) {
    for (let ring = rings; ring >= 1; ring--) {
        dc.frameRect(x - ring, y - ring, w + 2 * ring, h + 2 * ring, 1, withAlpha(color, Math.round(peak * (1 - ring / (rings + 1)))));
    }
}

// The Player Level's colour (pip, Level Toast, Profile Stats card): its
// Rank's metal, a little lighter at each level up to the next Rank.
export function playerLevelColorOf(level) {
    const { rank, progress } = playerLevelMetalOf(level);
    return mix(RANK_COLORS[rank], WHITE, 0.3 * progress);
}

const LEVEL_PIP_RATIO = 1 / 4;

// Where the level pip sits on an Avatar whose box, frame included, is side
// pixels from (x, y): on its bottom-right corner, in the same proportions on
// the Profile badge, the Welcome Screen and the Profile picker. The pip is
// ratio of the side high; its centre sits inside the corner by 9/34 of it.
export function levelPipOn(x, y, side, ratio = LEVEL_PIP_RATIO) {
    const inset = side * ratio * 9 / 34;
    return { cx: x + side - inset, cy: y + side - inset, size: Math.round(side * ratio) };
}

// The Player Level pip, centred on (cx, cy), size pixels high: round, in
// the metal of the level (Bronze up to Platinum), widening into an oval for three digits or more.
// A dark ring keeps it apart from any Avatar.
export function drawLevelPip(host, dc, level, cx, cy, size) {
    const number = String(level);
    const styled = host.createStyledText({ textAlign: "center", textStyle: { font: FONTS.display, size: Math.round(size * 0.6), weight: 700, color: COLORS.panel } });
    styled.add(number);
    const measured = styled.measure(UNBOUNDED);
    const ring = Math.max(2, Math.round(size / 14));
    // Even, so the round ends have a whole radius.
    const height = 2 * Math.round((size - 2 * ring) / 2);
    const width = number.length < 3 ? height : Math.max(height, Math.ceil(measured.width) + height / 2);
    const x = Math.round(cx - width / 2);
    const y = Math.round(cy - height / 2);
    fillPill(dc, x - ring, y - ring, width + 2 * ring, height + 2 * ring, COLORS.tile);
    fillPill(dc, x, y, width, height, playerLevelColorOf(level));
    styled.draw(dc, { x, y: y + (height - measured.height) / 2, width, height: measured.height });
}

// A disc when as wide as high, an oval with round ends when wider.
function fillPill(dc, x, y, w, h, color) {
    const r = h / 2;
    if (w > h) dc.fillRect(Math.round(x + r), y, Math.round(w - h), h, color);
    fillDisc(dc, x + r, y + r, r, color);
    if (w > h) fillDisc(dc, x + w - r, y + r, r, color);
}

export function drawAvatar(dc, path, x, y, size) {
    dc.fillRect(x, y, size, size, COLORS.tile);
    if (path) dc.drawImage(path, x + 3, y + 3, size - 6, size - 6);
    dc.frameRect(x, y, size, size, 3, COLORS.border);
}

// The close cross on a small tile.
export function drawCross(dc, x, y, size) {
    fillGradient(dc, x, y, size, size, COLORS.rowUnlocked, COLORS.tile);
    dc.frameRect(x, y, size, size, 2, COLORS.border);
    const inset = Math.round(size * 0.3);
    const t = Math.max(3, Math.round(size / 14));
    for (let i = 0; i <= size - 2 * inset; i++) {
        dc.fillRect(x + inset + i - 1, y + inset + i - 1, t, t, COLORS.description);
        dc.fillRect(x + size - inset - i - t + 1, y + inset + i - 1, t, t, COLORS.description);
    }
}

// A web-style tooltip: a dark rounded label with a small arrow whose tip
// is at (tipX, tipY), the label on the given side of the tip.
export function tooltip(host, dc, str, tipX, tipY, side) {
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

// A drawn screen's backdrop, on a window-sized canvas whose height is
// referenceHeight * scale: the dimmed wheel and the panel (in reference
// pixels), with a soft gold glow.
export function drawBackdrop(dc, { width, height }, referenceHeight, panel) {
    const scale = height / referenceHeight;
    dc.fillRect(0, 0, width, height, OVERLAY);
    const [x, y, w, h] = [panel.x, panel.y, panel.w, panel.h].map(value => Math.round(value * scale));
    glow(dc, x, y, w, h, COLORS.gold, 6, 0x30);
    fillGradient(dc, x, y, w, h, COLORS.panelTop, COLORS.panel);
    dc.frameRect(x, y, w, h, 1, COLORS.border);
}

// Gold halo and frame around the selected element.
export function selectionHalo(dc, x, y, w, h) {
    glow(dc, x, y, w, h, COLORS.gold, 12, 0x90);
    dc.frameRect(x, y, w, h, 4, COLORS.gold);
}

// A table's wheel logo ({ title, logoPath }) fitted in the box, its aspect
// kept; its title in size when it has none.
export function drawWheelLogo(host, dc, { title, logoPath }, { x, y, w, h }, size) {
    const image = logoPath ? dc.getImageSize(logoPath) : null;
    if (image && image.width > 0 && image.height > 0) {
        const scale = Math.min(w / image.width, h / image.height);
        const dw = Math.round(image.width * scale);
        const dh = Math.round(image.height * scale);
        dc.drawImage(logoPath, x + Math.round((w - dw) / 2), y + Math.round((h - dh) / 2), dw, dh);
        return;
    }
    text(host, dc, title, { x, y, width: w, height: h, size, weight: 700, font: FONTS.display, align: "center" });
}
