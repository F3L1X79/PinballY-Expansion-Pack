// ============================================================
// Giving up another Profile's Profile Stats while they get ready, through
// main.js on the fake PinballY globals: Exit leaves nothing of them and
// goes back to the Household Stats on that Profile's column, as Exit on
// the open screen would.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader } from "../support/loader_reader.js";
import { isProfileStatsOpen, profileStatsLayerCount } from "./profile_stats_reader.js";
import {
    openHouseholdStats, untilHouseholdStatsFadedIn, chooseColumn, isHouseholdStatsOpen, highlightedColumn, press,
} from "./household_stats_reader.js";

test("Exit while another Profile's Profile Stats get ready goes back to the Household Stats", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    openHouseholdStats(fake, lang);
    fake.setDrawMs(60);
    chooseColumn(fake, "Bob");
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");

    assert.ok(press(fake, "Exit").defaultPrevented);
    assert.equal(profileStatsLayerCount(fake), 0, "nothing of them left");
    untilHouseholdStatsFadedIn(fake);
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(isHouseholdStatsOpen(fake), true, "back to the Household Stats");
    assert.equal(highlightedColumn(fake), "Bob", "on that Profile's column");
    assertNoErrorLogged(fake);
});
