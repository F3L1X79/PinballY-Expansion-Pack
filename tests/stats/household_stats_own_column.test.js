// ============================================================
// One's own Household Stats column, through main.js on the fake PinballY
// globals: Select there goes straight back to one's own Profile Stats on
// the "Household Stats" button, as Exit does, never to a read-only copy.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "./household_stats_scenario.js";
import { cardTexts, highlighted, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { openHouseholdStats, chooseColumn, isHouseholdStatsOpen } from "./household_stats_reader.js";

test("Select on one's own column goes back to one's own Profile Stats", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Bob" });
    openHouseholdStats(fake, lang);

    const select = chooseColumn(fake, "Bob");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.ok(select.defaultPrevented);
    assert.ok(!isHouseholdStatsOpen(fake));
    assert.equal(cardTexts(fake)[0], "Bob");
    assert.equal(highlighted(fake), "Household Stats", "as Exit does");
    assert.deepEqual(errorLines(fake), []);
});
