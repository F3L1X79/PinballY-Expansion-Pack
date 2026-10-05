// ============================================================
// Welcome Screen painter: the layout and drawing of the Welcome Screen's
// pieces, in reference pixels (the window's height is REFERENCE_HEIGHT),
// from the prototype validated on the cabinet: the dimmed backdrop with
// the centred Steamball panel, the header (Avatar, close cross, greeting
// with the Profile's name in gold), the bottom row ("stay" and "random")
// and one highlight per choice (a gold halo, with a tooltip for the Avatar
// and the cross). Only drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";
import { mix, withAlpha, WHITE } from "./table_mastery.js";

// Above the Achievement List (6000 to 6006), under the toasts and the
// Profile picker. Exported for the tests' reader.
export const WELCOME_SCREEN_Z_INDEX = Object.freeze({ backdrop: 6100, header: 6101, rows: 6102, highlights: 6110 });

export const REFERENCE_HEIGHT = 1920;

export const CHOICE = Object.freeze({ AVATAR: "avatar", CLOSE: "close", STAY: "stay", RANDOM: "random" });

const OVERLAY = 0xD0080A0E;
const TOOLTIP = Object.freeze({ color: 0xFF0C0C0E, size: 22, weight: 400, height: 52, padX: 28, radius: 6, arrow: 10 });

const LOOK = Object.freeze({
    pad: 40, gap: 26,
    avatar: 120, cross: 56,
    greetingSize: 34, greetingGap: 36, greetingBottom: 44,
    rowH: 90, rowSize: 21, rowIcon: 60,
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
    const h = LOOK.pad + headerH + LOOK.gap + LOOK.rowH + LOOK.pad;
    const panel = { x: inner.x - LOOK.pad, y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    return { panel, inner, headerH, greetingY };
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

// screen: { picker, avatarPath, greeting (runs of [text, gold?]), choices,
// labels (by choice) }. Returns the pieces, each { zIndex, rect, draw(dc) }
// drawn in its rect's own coordinates, and the highlight of each choice.
export function layoutWelcomeScreen(host, screen, referenceWidth) {
    const { inner, headerH, greetingY, panel } = geometry(referenceWidth, screen);
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

    // "stay" and "random", side by side.
    const rowsTop = top + headerH + LOOK.gap;
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

    const M = LOOK.haloMargin;
    const highlightPiece = (rect, draw) => ({ zIndex: WELCOME_SCREEN_Z_INDEX.highlights, rect, draw });
    const haloAround = rect => highlightPiece(
        { x: rect.x - M, y: rect.y - M, w: rect.w + 2 * M, h: rect.h + 2 * M },
        dc => selectionHalo(dc, M, M, rect.w, rect.h)
    );
    const highlights = {
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
