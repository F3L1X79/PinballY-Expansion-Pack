// ============================================================
// Giving up another Profile's Profile Stats while they get ready, through
// main.js on the fake PinballY globals, with slow draws: Exit leaves
// nothing of them and shows the Household Stats again at once on that
// Profile's column, with no veil and no Loader, as Exit on the open screen would.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader } from "../support/loader_reader.js";
import { readVeil } from "../support/opening_reader.js";
import { isProfileStatsOpen, profileStatsLayerCount } from "./profile_stats_reader.js";
import {
    openHouseholdStats, chooseColumn, isHouseholdStatsOpen, highlightedColumn, press,
} from "./household_stats_reader.js";

test("Exit while another Profile's Profile Stats get ready shows the Household Stats again at once", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    openHouseholdStats(fake, lang);
    // The active Profile's, set aside under the Household Stats.
    const setAsideLayers = profileStatsLayerCount(fake);
    fake.setDrawMs(60);
    chooseColumn(fake, "Bob");
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");

    assert.ok(press(fake, "Exit").defaultPrevented);
    assert.equal(profileStatsLayerCount(fake), setAsideLayers, "nothing of them left");
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(isHouseholdStatsOpen(fake), true, "shown in the same step");
    assert.deepEqual(readVeil(fake), { shown: false });
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.equal(highlightedColumn(fake), "Bob", "on that Profile's column");
    assertNoErrorLogged(fake);
});
