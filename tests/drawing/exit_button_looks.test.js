// ============================================================
// The Exit Button's two looks, from the shared Steamball drawing on a
// recording drawing context: the back arrow and the cross share one
// colour, never gold, on the same tile; the arrow is centred on it and
// neither strays off it. Draws only; runs no screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { drawExitButton, EXIT_BUTTON_LOOK } from "../../common/drawing/steamball_drawing.js";
import { STEAMBALL_COLORS } from "../../common/drawing/steamball_palette.js";

const SIZE = 56;

function fillsOf(look) {
    const fills = [];
    const dc = { fillRect: (x, y, width, height, color) => fills.push({ x, y, width, height, color }), frameRect: () => {} };
    drawExitButton(dc, look, 100, 200, SIZE);
    return fills;
}

const colorsOf = fills => new Set(fills.map(fill => fill.color));

// The tile's own gradient bands span its whole width; the rest is the icon.
const iconFills = fills => fills.filter(fill => fill.width < SIZE);

test("the back arrow is drawn in the cross's colour, centred, both on the tile", () => {
    const arrow = fillsOf(EXIT_BUTTON_LOOK.BACK);
    const cross = fillsOf(EXIT_BUTTON_LOOK.CLOSE);

    assert.deepEqual([...colorsOf(iconFills(arrow))], [STEAMBALL_COLORS.description], "the arrow is the cross's colour");
    assert.deepEqual([...colorsOf(iconFills(cross))], [STEAMBALL_COLORS.description], "the cross keeps its colour");
    const top = Math.min(...iconFills(arrow).map(fill => fill.y)) - 200;
    const bottom = 200 + SIZE - Math.max(...iconFills(arrow).map(fill => fill.y + fill.height));
    assert.ok(Math.abs(top - bottom) <= 2, `the arrow has as much room under it as above it (${top} above, ${bottom} under)`);
    for (const fill of [...arrow, ...cross]) {
        assert.ok(fill.x >= 100 && fill.y >= 200 && fill.x + fill.width <= 100 + SIZE && fill.y + fill.height <= 200 + SIZE, "on the tile");
    }
});
