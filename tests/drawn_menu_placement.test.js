// ============================================================
// Where a Drawn Menu's panel stands in the window: a short menu's middle
// a third of the way down, a tall one within the margins it scrolls in.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { computeGeometry, DRAWN_MENU_LOOK, ROW_KIND } from "../common/drawn_menu_painter.js";

const WINDOW = { width: 1080, height: 1920 };
const menuOf = count => ({ message: null, rows: Array.from({ length: count }, (_, i) => ({ kind: ROW_KIND.ENTRY, title: `Entry ${i}` })) });
const noMessage = () => 0;

test("a short menu's middle stands a third of the way down the window", () => {
    const { panel } = computeGeometry(WINDOW, menuOf(4), noMessage);
    assert.ok(Math.abs(panel.y + panel.height / 2 - WINDOW.height / 3) < 0.5);
});

test("a tall menu keeps the same margin above and below", () => {
    const { panel } = computeGeometry(WINDOW, menuOf(80), noMessage);
    const margin = WINDOW.height * (1 - DRAWN_MENU_LOOK.maxHeightShare) / 2;
    assert.ok(Math.abs(panel.y - margin) < 0.5);
    assert.ok(Math.abs(WINDOW.height - panel.y - panel.height - margin) < 0.5);
});

test("a menu too tall for the third never goes above the top margin", () => {
    const { panel } = computeGeometry(WINDOW, menuOf(20), noMessage);
    assert.ok(panel.y >= WINDOW.height * (1 - DRAWN_MENU_LOOK.maxHeightShare) / 2 - 0.5);
    assert.ok(panel.y + panel.height <= WINDOW.height);
});
