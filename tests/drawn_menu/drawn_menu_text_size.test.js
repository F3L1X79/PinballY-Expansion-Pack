// ============================================================
// A Drawn Menu's texts at the prototype's sizes in pixels, through
// main.js on the fake PinballY globals with only the Drawn Menus Add-on
// on, in a cabinet's portrait window: StyledText takes its size in
// points (PinballY multiplies it by 4/3), so an entry the prototype
// draws at 36 px is given 27 pt, its gold copy on the selection too.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { DRAWN_MENU_Z_INDEX, DRAWN_MENU_LOOK, DRAWN_MENU_MARKS } from "../../common/drawn_menu_painter.js";
import { DRAWN_MENU_PANEL_WIDTH } from "../../common/drawn_menu_images.js";
import { openMainMenu } from "./drawn_menu_reader.js";

const WINDOW = { width: 1080, height: 1920 };
const PX_PER_PT = 4 / 3;
// The menu's scale in this window, as the painter computes it.
const K = Math.min(1, DRAWN_MENU_LOOK.maxWidthShare * WINDOW.width / DRAWN_MENU_PANEL_WIDTH);
const MARK_GLYPHS = Object.values(DRAWN_MENU_MARKS);

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0), layoutSize: WINDOW });
const textStrokesOn = zIndex => fake.drawingLayers()
    .filter(layer => layer.zIndex === zIndex && layer.alpha > 0)
    .flatMap(layer => layer.strokes())
    .filter(stroke => "text" in stroke && !MARK_GLYPHS.includes(stroke.text));
const pixelsOf = stroke => stroke.size * PX_PER_PT;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    await import("../../main.js");
    await settle();
    fake.advanceTime(5000);
    openMainMenu(fake);
});

test("the entries are drawn at the prototype's 36 px, given in points", () => {
    const strokes = textStrokesOn(DRAWN_MENU_Z_INDEX.texts);
    assert.ok(strokes.length > 0);
    for (const stroke of strokes) assert.ok(Math.abs(pixelsOf(stroke) - 36 * K) < 0.01, `"${stroke.text}" at ${pixelsOf(stroke)} px`);
});

test("the selected entry's gold text is drawn at the same size", () => {
    const [stroke] = textStrokesOn(DRAWN_MENU_Z_INDEX.selectedText);
    assert.ok(Math.abs(pixelsOf(stroke) - 36 * K) < 0.01, `${pixelsOf(stroke)} px`);
});

test("the texts land on whole pixels, so a separator's 1 px line stays one sharp row", () => {
    const layer = fake.drawingLayers().find(candidate => candidate.zIndex === DRAWN_MENU_Z_INDEX.texts && candidate.alpha > 0);
    const { width: canvasWidth, height: canvasHeight } = layer.canvasSize();
    const height = layer.scale().ySpan * WINDOW.height;
    const width = canvasWidth * height / canvasHeight;
    const left = (layer.position().x + 0.5) * WINDOW.width - width / 2;
    const top = (0.5 - layer.position().y) * WINDOW.height - height / 2;
    assert.ok(Math.abs(height - canvasHeight) < 1e-6, `${canvasHeight} px drawn, ${height} px shown`);
    assert.ok(Math.abs(left - Math.round(left)) < 1e-6 && Math.abs(top - Math.round(top)) < 1e-6, `at ${left}, ${top}`);
});
