// ============================================================
// The Household Stats' cross, through main.js on the fake PinballY
// globals: at the top right, its tooltip saying Back, Select on it goes
// back to one's own Profile Stats on the "Household Stats" button, as
// Exit does.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "./household_stats_scenario.js";
import { highlighted, isProfileStatsOpen, cardTexts, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { openHouseholdStats, highlightedColumn, isHouseholdStatsOpen, press } from "./household_stats_reader.js";

test("Select on the cross goes back to one's own Profile Stats", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    openHouseholdStats(fake, lang);

    press(fake, "Prev");
    assert.equal(highlightedColumn(fake), lang.profileStats.backTooltip);
    const select = press(fake, "Select");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.ok(select.defaultPrevented, "Select never reaches the wheel");
    assert.ok(!isHouseholdStatsOpen(fake));
    assert.ok(isProfileStatsOpen(fake));
    assert.equal(cardTexts(fake)[0], "Alice");
    assert.equal(highlighted(fake), lang.profileStats.buttons.household);
    assert.deepEqual(errorLines(fake), []);
});
