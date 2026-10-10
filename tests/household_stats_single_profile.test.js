// ============================================================
// A Household of one, through main.js on the fake PinballY globals: the
// Profile Stats offer no "Household" button.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "./household_stats_scenario.js";
import { openProfileStats, buttons } from "./profile_stats_reader.js";

test("one Household Profile: no Household button", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {} }, active: "Alice" });
    openProfileStats(fake, lang);

    assert.ok(buttons(fake).length > 0);
    assert.ok(!buttons(fake).some(button => button.label === "Household"));
    assert.deepEqual(errorLines(fake), []);
});
