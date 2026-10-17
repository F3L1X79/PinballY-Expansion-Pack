// ============================================================
// The Household Stats getting ready on a fast cabinet, through main.js on
// the fake PinballY globals: with draws quick enough to be ready within
// 150 ms, the wheel dims at once but the Loader never shows.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil, shownLayers } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { HOUSEHOLD_STATS_Z_INDEX } from "../../common/stats/household_stats_painter.js";
import { startOpeningHouseholdStats } from "./household_stats_reader.js";

const TICK_MS = 2;

test("a screen ready within 150 ms shows no Loader", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    fake.setDrawMs(10);

    startOpeningHouseholdStats(fake, lang);
    assert.equal(readVeil(fake).shown, true);
    for (let elapsed = 0; readVeil(fake).shown; elapsed += TICK_MS) {
        assert.ok(elapsed < 2000, "the screen fades in");
        assert.deepEqual(readLoader(fake), { shown: false }, `no Loader at ${elapsed} ms`);
        fake.advanceTime(TICK_MS);
    }
    assert.ok(shownLayers(fake, HOUSEHOLD_STATS_Z_INDEX.backdrop).every(layer => layer.alpha === 1));
    assertNoErrorLogged(fake);
});
