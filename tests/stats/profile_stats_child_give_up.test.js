// ============================================================
// Exit while the Household Stats, opened from the Profile Stats, still
// get ready, through main.js on the fake PinballY globals, with slow
// draws: that opening is given up and the Profile Stats show again at
// once on the Household button, with no veil, no Loader and no opening
// time line.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { openProfileStats, isProfileStatsOpen, highlighted, choose, press, markerLayer } from "./profile_stats_reader.js";
import { householdStatsLayerCount } from "./household_stats_reader.js";

const DRAW_MS = 60;

test("Exit while the Household Stats get ready shows the Profile Stats again at once", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    openProfileStats(fake, lang);
    fake.setDrawMs(DRAW_MS);

    choose(fake, lang.profileStats.buttons.household);
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "the Household Stats get ready");

    const mark = fake.logLines().length;
    press(fake, "Exit");
    assert.equal(householdStatsLayerCount(fake), 0, "given up");
    assert.equal(isProfileStatsOpen(fake), true, "shown in the same step");
    assert.deepEqual(readVeil(fake), { shown: false });
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.equal(markerLayer(fake).alpha, 1);
    assert.equal(highlighted(fake), lang.profileStats.buttons.household);
    fake.advanceTime(2000);
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.deepEqual(fake.logLines().slice(mark).filter(line => line.includes("] Opened")), [], "no opening time line");
    assertNoErrorLogged(fake);
});
