// ============================================================
// Pixel shapes shared by the Steamball painters: diamonds, rounded corners
// and capsules, drawn line by line with fillRect, the drawing context
// having no path fill. Only drawing: no layer, no event, no side effect.
// ============================================================

// A diamond centred on (centerX, centerY), drawn as stacked lines.
export function fillDiamond(dc, centerX, centerY, radius, color) {
    for (let dy = -radius; dy <= radius; dy++) {
        const half = radius - Math.abs(dy);
        dc.fillRect(Math.round(centerX - half), Math.round(centerY + dy), 2 * half + 1, 1, color);
    }
}

// How far a rounded corner eats into line i (0 = top line) of a shape.
export function cornerInset(radius, i) {
    return Math.round(radius - Math.sqrt(radius * radius - (radius - i - 0.5) ** 2));
}

// A vertical capsule (both ends rounded), drawn line by line.
export function fillCapsule(dc, x, y, width, height, color) {
    const radius = width / 2;
    for (let i = 0; i < height; i++) {
        const fromEnd = Math.min(i, height - 1 - i);
        const inset = fromEnd < radius ? cornerInset(radius, fromEnd) : 0;
        dc.fillRect(x + inset, y + i, width - 2 * inset, 1, color);
    }
}
