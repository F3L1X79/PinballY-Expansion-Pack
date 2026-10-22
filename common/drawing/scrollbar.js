// ============================================================
// Steamball scrollbar shared by the drawn lists (Achievement List, Avatar
// Frame list): a thin rail with a small diamond at each end, and a gold
// thumb in a soft glow, sized to the visible part of the list.
// Only drawing and layout: no layer, no event, no side effect.
// - The thumb goes on a layer of its own, drawn once and only moved.
// ============================================================

import { STEAMBALL_COLORS as COLORS } from "./steamball_palette.js";
import { mix, withAlpha } from "../mastery/table_mastery.js";
import { fillDiamond, fillCapsule } from "./pixel_shapes.js";

// In the Achievement List's layout pixels: a list in larger pixels gives
// its own scale.
export const SCROLLBAR_LOOK = Object.freeze({
    thumbWidth: 6,
    glow: 2,
    railWidth: 2,
    capRadius: 3,
    // Between the rail's ends and the rows area's.
    inset: 10,
    minThumbHeight: 40,
});

const scaled = (value, scale) => Math.round(value * scale);

// The scrollbar of a list listHeight tall shown in a rows area areaHeight
// tall from areaTop, its rail centred on centerX, or null when the list
// fits: the rail's extent, the thumb's layer size and how far the list
// scrolls. Sizes at scale times SCROLLBAR_LOOK's.
export function layoutScrollbar({ centerX, areaTop, areaHeight, listHeight, scale = 1 }) {
    if (listHeight <= areaHeight) return null;
    const inset = scaled(SCROLLBAR_LOOK.inset, scale);
    const height = areaHeight - 2 * inset;
    const minThumbHeight = scaled(SCROLLBAR_LOOK.minThumbHeight, scale);
    return {
        centerX,
        top: areaTop + inset,
        height,
        scale,
        thumbWidth: scaled(SCROLLBAR_LOOK.thumbWidth, scale) + 2 * scaled(SCROLLBAR_LOOK.glow, scale),
        // Never taller than the rail, even in a tiny window.
        thumbHeight: Math.min(height, Math.max(minThumbHeight, Math.round(height * areaHeight / listHeight))),
        maxScroll: listHeight - areaHeight,
    };
}

// The thumb's top for this scroll, in the same coordinates as bar.top.
export function thumbTopAt(bar, scroll) {
    const ratio = Math.min(1, Math.max(0, scroll / bar.maxScroll));
    return bar.top + (bar.height - bar.thumbHeight) * ratio;
}

// The box the rail and its end diamonds fill.
export function scrollbarRailRectOf(bar) {
    const cap = scaled(SCROLLBAR_LOOK.capRadius, bar.scale);
    return { x: Math.round(bar.centerX) - cap, y: bar.top - cap, w: 2 * cap + 1, h: bar.height + 2 * cap + 1 };
}

// The rail, which never moves: at the bar's place, or with its centre's
// top at (centerX, top) when drawn on a layer of its own.
export function drawScrollbarRail(dc, bar, { centerX = bar.centerX, top = bar.top } = {}) {
    const railWidth = scaled(SCROLLBAR_LOOK.railWidth, bar.scale);
    const cap = scaled(SCROLLBAR_LOOK.capRadius, bar.scale);
    const x = Math.round(centerX);
    dc.fillRect(x - Math.floor(railWidth / 2), top, railWidth, bar.height, COLORS.track);
    for (const capY of [top, top + bar.height]) {
        fillDiamond(dc, x, capY, cap, COLORS.gold);
        fillDiamond(dc, x, capY, Math.max(1, Math.round(cap / 3)), COLORS.title);
    }
}

// The thumb on its own layer, at the layer's size: a gold capsule in a
// soft glow, lit along its left side.
export function drawScrollbarThumb(dc, width, height, scale = 1) {
    const glow = scaled(SCROLLBAR_LOOK.glow, scale);
    fillCapsule(dc, 0, 0, width, height, withAlpha(COLORS.gold, 0x40));
    fillCapsule(dc, glow, glow, width - 2 * glow, height - 2 * glow, COLORS.gold);
    const bodyRadius = (width - 2 * glow) / 2;
    dc.fillRect(glow + 1, Math.round(glow + bodyRadius), scaled(1, scale), Math.max(0, Math.round(height - 2 * glow - 2 * bodyRadius)), mix(COLORS.gold, COLORS.title, 0.5));
}
