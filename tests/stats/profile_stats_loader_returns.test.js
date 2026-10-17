// ============================================================
// Coming back to the Profile Stats, through main.js on the fake PinballY
// globals, with slow draws: Exit from the Achievement List, the Avatar
// Frame list and the Household Stats dims the wheel at once under the
// veil, the Loader turns after 150 ms, then the Profile Stats fade in on
// the button they were left from.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/stats/profile_stats_painter.js";
import { isListOpen } from "../achievements/achievement_list_reader.js";
import {
    openProfileStats, untilProfileStatsFadedIn, isProfileStatsOpen, isFrameListOpen, highlighted, choose, press, PROFILE_STATS_OPEN_MS,
} from "./profile_stats_reader.js";
import { untilHouseholdStatsFadedIn } from "./household_stats_reader.js";

const DRAW_MS = 60;

// Exit from the screen on show, with slow draws: the Profile Stats get
// ready again behind the veil and the Loader, then fade in on label.
function exitBackTo(fake, label) {
    fake.setDrawMs(DRAW_MS);
    press(fake, "Exit");
    assert.equal(readVeil(fake).zIndex, PROFILE_STATS_Z_INDEX.backdrop - 2, "the wheel dimmed at once");
    assert.equal(isProfileStatsOpen(fake), false);
    fake.advanceTime(160);
    assert.equal(readLoader(fake).shown, true, "the Loader after 150 ms");
    untilProfileStatsFadedIn(fake);
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.deepEqual(readVeil(fake), { shown: false });
    assert.equal(highlighted(fake), label);
    fake.setDrawMs(0);
}

test("coming back from the Achievement List, the Avatar Frame list and the Household Stats goes through the same opening", async () => {
    // Without the Challenges, whose banner redraws as the main menu closes.
    const { fake, lang } = await startHousehold({
        profiles: { Alice: {}, Bob: {} }, active: "Alice", addOns: ["achievements", "tableMastery"], frameImages: true,
    });
    const { buttons } = lang.profileStats;
    openProfileStats(fake, lang);

    choose(fake, buttons.achievements);
    assert.ok(isListOpen(fake));
    exitBackTo(fake, buttons.achievements);

    choose(fake, buttons.frame);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.ok(isFrameListOpen(fake));
    exitBackTo(fake, buttons.frame);

    choose(fake, buttons.household);
    untilHouseholdStatsFadedIn(fake);
    exitBackTo(fake, buttons.household);
    assertNoErrorLogged(fake);
});
