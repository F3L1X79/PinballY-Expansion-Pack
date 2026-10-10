// ============================================================
// An Avatar image missing from the install, through main.js on the fake
// PinballY globals: it is logged and the Household Stats' column shows
// without it. Guest is active: it has no column, and the halo starts on
// the first one.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines, DEFAULT_AVATAR, PROFILES } from "./household_stats_scenario.js";
import { openHouseholdStats, columns, highlightedColumn } from "./household_stats_reader.js";

test("a missing Avatar is logged and its column shows without it", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: { avatar: true }, Bob: {} }, hasDefaultAvatar: false });
    openHouseholdStats(fake, lang);

    assert.deepEqual(columns(fake).map(({ name, avatar }) => ({ name, avatar })), [
        { name: "Alice", avatar: `${PROFILES}\\Alice\\avatar.png` },
        { name: "Bob", avatar: null },
    ]);
    assert.equal(highlightedColumn(fake), "Alice");
    assert.ok(fake.logLines().some(line => line.includes("[HouseholdStats]") && line.includes(DEFAULT_AVATAR) && line.includes("Bob")));
    assert.deepEqual(errorLines(fake), []);
});
