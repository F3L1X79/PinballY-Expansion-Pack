// ============================================================
// The Household Stats getting ready, through main.js on the fake PinballY
// globals, with draws slow enough to take more than 150 ms in all: the
// wheel dims at once under the veil, the Loader turns over it after
// 150 ms, then goes before every layer fades in together, the veil going
// once the fade in is over. Coming back from another Profile's Profile
// Stats goes through the same opening.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil, shownLayers } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { DIMMED_WHEEL } from "../../common/drawing/steamball_drawing.js";
import { HOUSEHOLD_STATS_Z_INDEX } from "../../common/stats/household_stats_painter.js";
import { PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import {
    startOpeningHouseholdStats, untilHouseholdStatsFadedIn, chooseColumn, isHouseholdStatsOpen, press, title,
} from "./household_stats_reader.js";

const VEIL = { shown: true, zIndex: HOUSEHOLD_STATS_Z_INDEX.backdrop - 2, color: DIMMED_WHEEL };
const DRAW_MS = 60;
const TICK_MS = 4;

// The screen's layers that fade in, the cross's tooltip and marker left out.
const fadingLayers = fake => fake.drawingLayers().filter(layer =>
    [HOUSEHOLD_STATS_Z_INDEX.backdrop, HOUSEHOLD_STATS_Z_INDEX.title, HOUSEHOLD_STATS_Z_INDEX.labels,
        HOUSEHOLD_STATS_Z_INDEX.columns, HOUSEHOLD_STATS_Z_INDEX.cross].includes(layer.zIndex));

// Runs the clock a tick at a time until the screen starts fading in;
// returns how long it took.
function untilFadeStarts(fake) {
    let elapsed = 0;
    while (shownLayers(fake, HOUSEHOLD_STATS_Z_INDEX.backdrop).length === 0) {
        assert.ok(elapsed < 10000, "the screen starts fading in");
        fake.advanceTime(TICK_MS);
        elapsed += TICK_MS;
    }
    return elapsed;
}

test("the wheel dims at once, the Loader turns after 150 ms, then the screen fades in whole and the veil goes", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    fake.setDrawMs(DRAW_MS);

    const select = startOpeningHouseholdStats(fake, lang);
    assert.ok(select.defaultPrevented);
    assert.deepEqual(readVeil(fake), VEIL, "the wheel dimmed at once");
    assert.equal(isHouseholdStatsOpen(fake), false, "nothing of the screen shows yet");

    fake.advanceTime(140);
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader within 150 ms");
    fake.advanceTime(20);
    const loader = readLoader(fake);
    assert.equal(loader.shown, true, "the Loader after 150 ms");
    assert.equal(loader.zIndex, HOUSEHOLD_STATS_Z_INDEX.backdrop - 1, "over the veil, under the screen");
    assert.deepEqual(readVeil(fake), VEIL);

    untilFadeStarts(fake);
    assert.deepEqual(readLoader(fake), { shown: false }, "the Loader gone before the fade in");
    assert.deepEqual(readVeil(fake), VEIL, "the veil stays while the screen fades in");
    const alphas = new Set(fadingLayers(fake).map(layer => layer.alpha));
    assert.equal(alphas.size, 1, `every layer fades in together, got ${[...alphas]}`);
    assert.ok([...alphas][0] < 1);

    untilHouseholdStatsFadedIn(fake);
    assert.deepEqual(readVeil(fake), { shown: false }, "the veil goes once the fade in is over");
    assert.ok(fadingLayers(fake).every(layer => layer.alpha === 1));
    assert.equal(title(fake), "Household Stats");

    // Exit from another Profile's Profile Stats comes back through the same opening.
    fake.setDrawMs(0);
    chooseColumn(fake, "Bob");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    fake.setDrawMs(DRAW_MS);
    press(fake, "Exit");
    assert.deepEqual(readVeil(fake), VEIL, "the wheel dimmed at once again");
    assert.equal(isHouseholdStatsOpen(fake), false);
    fake.advanceTime(160);
    assert.equal(readLoader(fake).shown, true);
    untilHouseholdStatsFadedIn(fake);
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.deepEqual(readVeil(fake), { shown: false });
    assertNoErrorLogged(fake);
});
