// ============================================================
// The Profile Stats getting ready on a fast cabinet, through main.js on
// the fake PinballY globals: with draws quick enough to be ready within
// 150 ms, the wheel dims at once but the Loader never shows.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { shownLayers } from "../support/shown_layers.js";
import { readLoader } from "../support/loader_reader.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/stats/profile_stats_painter.js";
import { startOpeningProfileStats } from "./profile_stats_reader.js";

const TICK_MS = 2;

test("Profile Stats ready within 150 ms show no Loader", async () => {
    // Without the Challenges, whose banner redraws as the main menu closes.
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice", addOns: ["achievements", "tableMastery"] });
    fake.setDrawMs(5);

    startOpeningProfileStats(fake, lang);
    assert.equal(readVeil(fake).shown, true);
    for (let elapsed = 0; readVeil(fake).shown; elapsed += TICK_MS) {
        assert.ok(elapsed < 2000, "the screen fades in");
        assert.deepEqual(readLoader(fake), { shown: false }, `no Loader at ${elapsed} ms`);
        fake.advanceTime(TICK_MS);
    }
    assert.ok(shownLayers(fake, PROFILE_STATS_Z_INDEX.backdrop).every(layer => layer.alpha === 1));
    assertNoErrorLogged(fake);
});
