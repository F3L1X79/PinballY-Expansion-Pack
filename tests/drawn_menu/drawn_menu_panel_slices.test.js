// ============================================================
// A Drawn Menu's panel and glass slices in a portrait window: each end is
// drawn and shown at the menu's size, on whole pixels, the middle filling
// between them.
// - Resampled, an end's first row blends with its last: a 1 px line across the panel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { DRAWN_MENU_IMAGES } from "../../common/drawn_menu/drawn_menu_images.js";
import { openMainMenu } from "./drawn_menu_reader.js";

const WINDOW = { width: 1080, height: 1920 };
const IMAGES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\drawn_menu";

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0), layoutSize: WINDOW });

// The shown layer holding the image, its canvas size and its box in window pixels.
function shownSlice(image) {
    const layer = fake.drawingLayers().find(candidate => candidate.alpha > 0 && candidate.images().includes(`${IMAGES_FOLDER}\\${image.file}`));
    const canvas = layer.canvasSize();
    const height = layer.scale().ySpan * WINDOW.height;
    const width = layer.scale().xSpan === undefined ? canvas.width * height / canvas.height : layer.scale().xSpan * WINDOW.width;
    const top = (0.5 - layer.position().y) * WINDOW.height - height / 2;
    const left = (layer.position().x + 0.5) * WINDOW.width - width / 2;
    return { canvas, top, left, width, height };
}

const isWhole = value => Math.abs(value - Math.round(value)) < 1e-6;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    await import("../../main.js");
    await settle();
    fake.advanceTime(5000);
    openMainMenu(fake);
});

for (const [name, stack] of Object.entries({ panel: DRAWN_MENU_IMAGES.panel, glass: DRAWN_MENU_IMAGES.glass })) {
    test(`the ${name}'s top and bottom are shown at their drawn size, on whole pixels`, () => {
        for (const image of [stack.top, stack.bottom]) {
            const slice = shownSlice(image);
            assert.ok(Math.abs(slice.height - slice.canvas.height) < 1e-6, `${image.file}: ${slice.canvas.height} px drawn, ${slice.height} px shown`);
            assert.ok(Math.abs(slice.width - slice.canvas.width) < 1e-6, `${image.file}: ${slice.canvas.width} px drawn, ${slice.width} px shown`);
            assert.ok(isWhole(slice.top) && isWhole(slice.left), `${image.file} at ${slice.left}, ${slice.top}`);
        }
    });

    test(`the ${name}'s middle fills the rows between its ends exactly`, () => {
        const [top, middle, bottom] = [stack.top, stack.middle, stack.bottom].map(shownSlice);
        assert.ok(Math.abs(middle.top - (top.top + top.height)) < 1e-6, `middle from ${middle.top}, top ends at ${top.top + top.height}`);
        assert.ok(Math.abs(middle.top + middle.height - bottom.top) < 1e-6, `middle to ${middle.top + middle.height}, bottom from ${bottom.top}`);
    });
}
