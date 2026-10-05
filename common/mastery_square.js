// ============================================================
// Mastery square: the Mastery Level's number in a square in its metal,
// with a see-through halo wider and stronger from one level to the next,
// or a dim "0" for a table never played. Drawn at the end of the wheel's
// Mastery Bar and of the Welcome Screen's Mastery cards. Only drawing: no
// text from the language files, no layer, no side effect.
// ============================================================

import { STEAMBALL_COLORS, STEAMBALL_FONTS } from "./steamball_palette.js";
import { MAX_MASTERY_LEVEL, metalOf, withAlpha } from "./table_mastery.js";

const SQUARE = Object.freeze({ size: 48, border: 2, thickBorderFrom: 7, bandShare: 0.45, numberShare: 0.55 });
// From level 1 to 10: 6 to 18 rings, peak alpha 0x60 to 0xF0.
const HALO = Object.freeze({ minRings: 6, extraRings: 12, minPeak: 0x60, extraPeak: 0x90 });
const NEVER_PLAYED = 0;

// Its rings scaled by k.
function drawHalo(dc, level, metal, x, y, size, k) {
    const glow = (level - 1) / (MAX_MASTERY_LEVEL - 1);
    const rings = Math.round((HALO.minRings + Math.round(HALO.extraRings * glow)) * k);
    const peak = HALO.minPeak + Math.round(HALO.extraPeak * glow);
    for (let ring = rings; ring >= 1; ring--) {
        const fade = 1 - (ring - 1) / rings;
        dc.frameRect(x - ring, y - ring, size + 2 * ring, size + 2 * ring, 1, withAlpha(metal, Math.round(peak * fade)));
    }
}

// The square's side at scale k.
export const masterySquareSize = (k = 1) => Math.round(SQUARE.size * k);

// The level's square with its top-left corner at (x, y), scaled by k.
export function drawMasterySquare(host, dc, level, x, y, k = 1) {
    const size = masterySquareSize(k);
    const metal = level === NEVER_PLAYED ? STEAMBALL_COLORS.dim : metalOf(level);
    if (level !== NEVER_PLAYED) drawHalo(dc, level, metal, x, y, size, k);
    dc.fillRect(x, y, size, size, STEAMBALL_COLORS.tile);
    // A lighter band on top, like polished metal.
    if (level !== NEVER_PLAYED) dc.fillRect(x, y, size, Math.round(size * SQUARE.bandShare), withAlpha(metal, 0x18 + level * 4));
    dc.frameRect(x, y, size, size, Math.round((SQUARE.border + (level >= SQUARE.thickBorderFrom ? 1 : 0)) * k), metal);
    const styled = host.createStyledText({
        textAlign: "center",
        textStyle: { font: STEAMBALL_FONTS.display, size: Math.round(size * SQUARE.numberShare), weight: 700, color: metal },
    });
    styled.add(String(level));
    const measured = styled.measure(size).height;
    styled.draw(dc, { x, y: y + (size - measured) / 2, width: size, height: measured });
}
