// ============================================================
// No level pip on the Profile picker's carousel with the Achievements
// Add-on off, through main.js on the fake PinballY globals.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, ALL_TOASTS_MS } from "../mastery/mastery_bar_scenario.js";
import { shownPip } from "../levels/level_pip_reader.js";
import { shownLayers } from "../support/shown_layers.js";

const PIP_Z = 6503;

async function openCarousel(fake) {
    const { default: lang } = await import("../../common/core/i18n.js");
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
}

const carouselPips = fake => shownLayers(fake, PIP_Z)
    .map(shownPip)
    .sort();

test("no pip on the carousel with the Achievements Add-on off", async () => {
    const fake = await startScenario({ addOns: ["profilePicker"], profiles: { guest: {}, Alice: {} } });
    fake.advanceTime(ALL_TOASTS_MS);
    await openCarousel(fake);
    assert.ok(fake.drawingLayers().some(layer => layer.zIndex === 6501 && layer.alpha > 0), "the carousel is open");
    assert.deepEqual(carouselPips(fake), []);

    assert.deepEqual(errorLines(fake), []);
});
