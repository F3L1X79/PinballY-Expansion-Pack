// ============================================================
// Giving up the Household Stats while they get ready, through main.js on
// the fake PinballY globals: Next, Prev and Select are swallowed; Exit
// gives up (no Loader, no layer of the screen left, only the Profile
// Stats' own veil) and goes back to the Profile Stats, as Exit would once open; attract mode gives up the
// same way without going back anywhere.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import { isProfileStatsOpen, highlighted, untilProfileStatsFadedIn } from "./profile_stats_reader.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/stats/profile_stats_painter.js";
import { startOpeningHouseholdStats, isHouseholdStatsOpen, householdStatsLayerCount, press } from "./household_stats_reader.js";

const DRAW_MS = 60;

function assertNothingLeft(fake) {
    assert.deepEqual(readVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    assert.equal(loaderLayerCount(fake), 0);
    assert.equal(householdStatsLayerCount(fake), 0, "no layer of the screen");
}

test("Exit while the Household Stats get ready gives up and goes back; attract mode only gives up", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    fake.setDrawMs(DRAW_MS);

    startOpeningHouseholdStats(fake, lang);
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");
    for (const button of ["Next", "Prev", "Select"]) {
        assert.ok(press(fake, button).defaultPrevented, `${button} never reaches the wheel`);
    }
    assert.equal(readLoader(fake).shown, true, "still getting ready");
    assert.equal(isProfileStatsOpen(fake), false);

    const exit = press(fake, "Exit");
    assert.ok(exit.defaultPrevented);
    assert.equal(householdStatsLayerCount(fake), 0, "no layer of the screen");
    assert.equal(readVeil(fake).zIndex, PROFILE_STATS_Z_INDEX.backdrop - 2, "the Profile Stats' veil, as they get ready in turn");
    untilProfileStatsFadedIn(fake);
    assertNothingLeft(fake);
    assert.equal(isHouseholdStatsOpen(fake), false);
    assert.equal(isProfileStatsOpen(fake), true, "back to the Profile Stats");
    assert.equal(highlighted(fake), "Household Stats", "on their button");

    press(fake, "Select");
    fake.advanceTime(200);
    assert.equal(readVeil(fake).shown, true, "getting ready again");
    fake.fire("attractmodestart", {});
    assertNothingLeft(fake);
    fake.advanceTime(2000);
    assertNothingLeft(fake);
    assert.equal(isProfileStatsOpen(fake), false, "attract mode goes back nowhere");
    assertNoErrorLogged(fake);
});
