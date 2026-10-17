// ============================================================
// The Exit Button's two looks, from the shared Steamball drawing on a
// recording drawing context: the back arrow is gold, the cross is not, on
// the same tile, and neither strays off it. Draws only; runs no screen.
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

test("the back arrow is drawn in gold, the cross without, both on the tile", () => {
    const arrow = fillsOf(EXIT_BUTTON_LOOK.BACK);
    const cross = fillsOf(EXIT_BUTTON_LOOK.CLOSE);

    assert.ok(colorsOf(arrow).has(STEAMBALL_COLORS.gold), "the arrow is gold");
    assert.ok(!colorsOf(cross).has(STEAMBALL_COLORS.gold), "the cross is not");
    assert.ok(colorsOf(cross).has(STEAMBALL_COLORS.description), "the cross keeps its colour");
    for (const fill of [...arrow, ...cross]) {
        assert.ok(fill.x >= 100 && fill.y >= 200 && fill.x + fill.width <= 100 + SIZE && fill.y + fill.height <= 200 + SIZE, "on the tile");
    }
});
