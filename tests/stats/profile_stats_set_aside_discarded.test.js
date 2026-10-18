// ============================================================
// The Profile Stats set aside under a child screen are removed, through
// main.js on the fake PinballY globals: when attract mode starts with the
// Achievement List open, and when the Household Stats fail to open; the
// Profile Stats opened again from the main menu are read afresh.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { errorLines } from "../support/error_log.js";
import { whileDrawsFail, FAILING_DRAW_MESSAGE } from "../support/failing_draws.js";
import { readVeil } from "../support/opening_reader.js";
import { isListOpen } from "../achievements/achievement_list_reader.js";
import { openProfileStats, startOpeningProfileStats, untilProfileStatsFadedIn, profileStatsLayerCount, isProfileStatsOpen, choose } from "./profile_stats_reader.js";
import { householdStatsLayerCount } from "./household_stats_reader.js";

const openingLinesSince = (fake, mark) => fake.logLines().slice(mark).filter(line => line.startsWith("[ProfileStats] Opened"));

test("attract mode and a child failing to open leave no layer of the Profile Stats; the main menu opens them afresh", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    const TEXT = lang.profileStats;
    openProfileStats(fake, lang);
    choose(fake, TEXT.buttons.achievements);
    assert.ok(isListOpen(fake));

    fake.enterAttractMode();
    assert.equal(profileStatsLayerCount(fake), 0, "no layer of the Profile Stats, hidden or not");
    assert.equal(isListOpen(fake), false);
    fake.exitAttractMode();

    let mark = fake.logLines().length;
    startOpeningProfileStats(fake, lang);
    assert.equal(readVeil(fake).shown, true, "read afresh, through the opening");
    untilProfileStatsFadedIn(fake);
    assert.equal(openingLinesSince(fake, mark).length, 1);

    whileDrawsFail(() => {
        choose(fake, TEXT.buttons.household);
        fake.advanceTime(1000);
    });
    const errors = errorLines(fake);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].startsWith("[DrawingAhead] ERROR") && errors[0].includes(FAILING_DRAW_MESSAGE), "the failure is logged");
    assert.equal(householdStatsLayerCount(fake), 0);
    assert.equal(profileStatsLayerCount(fake), 0, "no layer of the Profile Stats, hidden or not");
    assert.deepEqual(readVeil(fake), { shown: false });

    mark = fake.logLines().length;
    openProfileStats(fake, lang);
    assert.equal(isProfileStatsOpen(fake), true);
    assert.equal(openingLinesSince(fake, mark).length, 1, "read afresh");
    assert.deepEqual(errorLines(fake), errors, "no other error");
});
