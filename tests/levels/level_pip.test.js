// ============================================================
// Level pip: drawn by the shared helper, round up to two digits and
// widening into an oval from three, in a metal from Bronze to Platinum
// that lightens with each level; through main.js on the fake PinballY
// globals, no pip on the badge with the Achievements Add-on off.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { startScenario, errorLines, ALL_TOASTS_MS } from "../mastery/mastery_bar_scenario.js";
import { shownPip, pipWidth, pipColor } from "./level_pip_reader.js";
import { drawLevelPip, levelPipOn } from "../../common/steamball_drawing.js";
import { RANK_COLORS } from "../../common/steamball_palette.js";
import { ACHIEVEMENT_RANK } from "../../common/achievements.js";

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

test("the pip goes from Bronze to Platinum as the level climbs, lighter at each level", () => {
    const { BRONZE, SILVER, GOLD, PLATINUM } = ACHIEVEMENT_RANK;
    for (const [level, rank] of [[1, BRONZE], [5, SILVER], [10, GOLD], [20, PLATINUM]]) {
        assert.equal(pipColor(drawnPip(level)), RANK_COLORS[rank], `level ${level}`);
    }
    const brightness = color => ((color >>> 16) & 0xFF) + ((color >>> 8) & 0xFF) + (color & 0xFF);
    assert.ok(brightness(pipColor(drawnPip(4))) > brightness(pipColor(drawnPip(1))), "lighter within a Rank");
    assert.equal(pipColor(drawnPip(30)), pipColor(drawnPip(80)), "Platinum stops lightening");
});

test("the pip sits on any Avatar in the same proportions", () => {
    assert.deepEqual(levelPipOn(10, 20, 136), { cx: 137, cy: 147, size: 34 }, "the Profile badge's");
    const small = levelPipOn(0, 0, 136);
    const big = levelPipOn(0, 0, 272);
    assert.deepEqual([big.cx, big.cy, big.size], [2 * small.cx, 2 * small.cy, 2 * small.size]);
});

test("no pip with the Achievements Add-on off", async () => {
    const fake = await startScenario({ addOns: ["profilePicker"], profiles: { guest: {} } });
    fake.advanceTime(ALL_TOASTS_MS);
    const badge = fake.drawingLayers().find(layer => layer.zIndex === BADGE_Z);
    assert.ok(badge.alpha > 0, "the badge shows");
    assert.equal(shownPip(badge), null, "without a pip");

    assert.deepEqual(errorLines(fake), []);
});
