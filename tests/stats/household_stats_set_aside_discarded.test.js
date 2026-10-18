// ============================================================
// The Household Stats set aside under another Profile's Profile Stats are
// removed, through main.js on the fake PinballY globals: attract mode
// starting with those Profile Stats open leaves no layer of either screen
// nor of the opening, hidden or not, and so do those Profile Stats failing
// to open.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { errorLines } from "../support/error_log.js";
import { whileDrawsFail, FAILING_DRAW_MESSAGE } from "../support/failing_draws.js";
import { readVeil } from "../support/opening_reader.js";
import { loaderLayerCount } from "../support/loader_reader.js";
import { isProfileStatsOpen, profileStatsLayerCount, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { openHouseholdStats, chooseColumn, isHouseholdStatsOpen, householdStatsLayerCount, press } from "./household_stats_reader.js";

function assertNoLayerLeft(fake) {
    assert.equal(householdStatsLayerCount(fake), 0, "no layer of the Household Stats, hidden or not");
    assert.equal(profileStatsLayerCount(fake), 0, "no layer of the Profile Stats, hidden or not");
    assert.equal(loaderLayerCount(fake), 0, "no Loader");
    assert.deepEqual(readVeil(fake), { shown: false });
}

test("attract mode and another Profile's Profile Stats failing to open leave no layer of the stats screens", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    openHouseholdStats(fake, lang);
    chooseColumn(fake, "Bob");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.ok(isProfileStatsOpen(fake));

    fake.enterAttractMode();
    assertNoLayerLeft(fake);
    fake.exitAttractMode();
    assert.ok(!press(fake, "Exit").defaultPrevented, "no screen left to take the buttons");

    openHouseholdStats(fake, lang);
    whileDrawsFail(() => {
        chooseColumn(fake, "Bob");
        fake.advanceTime(1000);
    });
    const errors = errorLines(fake);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].startsWith("[DrawingAhead] ERROR") && errors[0].includes(FAILING_DRAW_MESSAGE), "the failure is logged");
    assertNoLayerLeft(fake);
    assert.equal(isHouseholdStatsOpen(fake), false);
    assert.ok(!press(fake, "Exit").defaultPrevented, "no screen left to take the buttons");
});
