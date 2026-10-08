// ============================================================
// Level pip: drawn by the shared helper, round up to two digits and
// widening into an oval from three; through main.js on the fake PinballY
// globals, no pip on the badge with the Achievements Add-on off.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { startScenario, errorLines, ALL_TOASTS_MS } from "./mastery_bar_scenario.js";
import { shownPip, pipWidth } from "./level_pip_reader.js";
import { drawLevelPip } from "../common/steamball_drawing.js";

const BADGE_Z = 4500;

function drawnPip(level) {
    const fake = createFakePinballYHost();
    const layer = fake.createDrawingLayer(0);
    layer.draw(dc => drawLevelPip(fake, dc, level, 50, 50, 34), 100, 100);
    return layer;
}

test("the pip is round up to two digits and widens into an oval from three", () => {
    for (const level of [7, 42, 123]) assert.equal(shownPip(drawnPip(level)), String(level));
    assert.equal(pipWidth(drawnPip(7)), pipWidth(drawnPip(42)), "one or two digits: the same disc");
    assert.ok(pipWidth(drawnPip(123)) > pipWidth(drawnPip(42)), "three digits: wider");
});

test("no pip with the Achievements Add-on off", async () => {
    const fake = await startScenario({ addOns: ["profilePicker"], profiles: { guest: {} } });
    fake.advanceTime(ALL_TOASTS_MS);
    const badge = fake.drawingLayers().find(layer => layer.zIndex === BADGE_Z);
    assert.ok(badge.alpha > 0, "the badge shows");
    assert.equal(shownPip(badge), null, "without a pip");

    assert.deepEqual(errorLines(fake), []);
});
