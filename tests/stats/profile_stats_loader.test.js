// ============================================================
// The Profile Stats getting ready, through main.js on the fake PinballY
// globals, with draws slow enough to take more than 150 ms in all: opened
// from the main menu, the wheel dims at once under the veil, the Loader
// turns over it after 150 ms, then goes before every layer fades in
// together, the veil going once the fade in is over. Another Profile's
// Profile Stats, opened from its Household Stats column, go through the
// same opening.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil, shownLayers } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { DIMMED_WHEEL } from "../../common/drawing/steamball_drawing.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/stats/profile_stats_painter.js";
import {
    startOpeningProfileStats, untilProfileStatsFadedIn, isProfileStatsOpen, isReadOnly, cardTexts, choose,
} from "./profile_stats_reader.js";
import { untilHouseholdStatsFadedIn, chooseColumn } from "./household_stats_reader.js";

const VEIL = { shown: true, zIndex: PROFILE_STATS_Z_INDEX.backdrop - 2, color: DIMMED_WHEEL };
const DRAW_MS = 60;
const TICK_MS = 4;

// The screen's layers that fade in, the tooltips and marker left out.
const fadingLayers = fake => fake.drawingLayers().filter(layer =>
    [PROFILE_STATS_Z_INDEX.backdrop, PROFILE_STATS_Z_INDEX.card, PROFILE_STATS_Z_INDEX.sections,
        PROFILE_STATS_Z_INDEX.buttons, PROFILE_STATS_Z_INDEX.exitButton].includes(layer.zIndex));

// Runs the clock a tick at a time until the screen starts fading in.
function untilFadeStarts(fake) {
    for (let elapsed = 0; shownLayers(fake, PROFILE_STATS_Z_INDEX.backdrop).length === 0; elapsed += TICK_MS) {
        assert.ok(elapsed < 10000, "the screen starts fading in");
        fake.advanceTime(TICK_MS);
    }
}

// From the press that opens them: veil at once, Loader after 150 ms, gone
// before the fade in whole, veil gone after it.
function expectOpening(fake) {
    assert.deepEqual(readVeil(fake), VEIL, "the wheel dimmed at once");
    assert.equal(isProfileStatsOpen(fake), false, "nothing of the screen shows yet");
    fake.advanceTime(140);
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader within 150 ms");
    fake.advanceTime(20);
    const loader = readLoader(fake);
    assert.equal(loader.shown, true, "the Loader after 150 ms");
    assert.equal(loader.zIndex, PROFILE_STATS_Z_INDEX.backdrop - 1, "over the veil, under the screen");
    assert.deepEqual(readVeil(fake), VEIL);

    untilFadeStarts(fake);
    assert.deepEqual(readLoader(fake), { shown: false }, "the Loader gone before the fade in");
    assert.deepEqual(readVeil(fake), VEIL, "the veil stays while the screen fades in");
    const alphas = new Set(fadingLayers(fake).map(layer => layer.alpha));
    assert.equal(alphas.size, 1, `every layer fades in together, got ${[...alphas]}`);
    assert.ok([...alphas][0] < 1);

    untilProfileStatsFadedIn(fake);
    assert.deepEqual(readVeil(fake), { shown: false }, "the veil goes once the fade in is over");
}

test("the Profile Stats dim the wheel at once, show the Loader after 150 ms and fade in whole", async () => {
    // Without the Challenges, whose banner redraws as the main menu closes:
    // its slow draw would count in the Profile Stats' first 150 ms.
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice", addOns: ["achievements", "tableMastery"] });
    fake.setDrawMs(DRAW_MS);

    startOpeningProfileStats(fake, lang);
    expectOpening(fake);
    assert.equal(cardTexts(fake)[0], "Alice");
    assert.equal(isReadOnly(fake), false);

    // Another Profile's, from its Household Stats column.
    fake.setDrawMs(0);
    choose(fake, lang.profileStats.buttons.household);
    untilHouseholdStatsFadedIn(fake);
    fake.setDrawMs(DRAW_MS);
    chooseColumn(fake, "Bob");
    expectOpening(fake);
    assert.equal(cardTexts(fake)[0], "Bob");
    assert.equal(isReadOnly(fake), true);
    assertNoErrorLogged(fake);
});
