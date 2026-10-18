// ============================================================
// Coming back to the Profile Stats, through main.js on the fake PinballY
// globals, with slow draws: Exit from the Achievement List and the
// Household Stats shows them again at once, fully opaque, on the button
// they were left from, with no veil, no Loader and no opening time line;
// Exit from the Avatar Frame list still dims the wheel under the veil,
// turns the Loader after 150 ms, then fades them in.
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
    openProfileStats, untilProfileStatsFadedIn, isProfileStatsOpen, isFrameListOpen, highlighted, choose, press, markerLayer, PROFILE_STATS_OPEN_MS,
} from "./profile_stats_reader.js";
import { untilHouseholdStatsFadedIn } from "./household_stats_reader.js";

const DRAW_MS = 60;

const profileStatsLayers = fake => fake.drawingLayers().filter(layer => Object.values(PROFILE_STATS_Z_INDEX).includes(layer.zIndex));
const openingLinesSince = (fake, mark) => fake.logLines().slice(mark).filter(line => line.startsWith("[ProfileStats] Opened"));

// Exit from the screen on show, with slow draws: the Profile Stats show
// again in the same step, every layer either fully in or kept hidden.
function exitShowsAtOnce(fake, label) {
    fake.setDrawMs(DRAW_MS);
    const mark = fake.logLines().length;
    press(fake, "Exit");
    assert.equal(isProfileStatsOpen(fake), true, "shown in the same step");
    assert.deepEqual(readVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    assert.ok(profileStatsLayers(fake).every(layer => layer.alpha === 0 || layer.alpha === 1), "no fade");
    assert.equal(markerLayer(fake).alpha, 1);
    assert.equal(highlighted(fake), label);
    fake.advanceTime(160);
    assert.deepEqual(readLoader(fake), { shown: false }, "still no Loader");
    assert.deepEqual(openingLinesSince(fake, mark), [], "no opening time line");
    fake.setDrawMs(0);
}

// Exit from the Avatar Frame list, with slow draws: the Profile Stats get
// ready again behind the veil and the Loader, then fade in on label.
function exitOpensAgain(fake, label) {
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

test("back from the Achievement List and the Household Stats at once; back from the Avatar Frame list through the opening", async () => {
    // Without the Challenges, whose banner redraws as the main menu closes.
    const { fake, lang } = await startHousehold({
        profiles: { Alice: {}, Bob: {} }, active: "Alice", addOns: ["achievements", "tableMastery"], frameImages: true,
    });
    const { buttons } = lang.profileStats;
    openProfileStats(fake, lang);

    choose(fake, buttons.achievements);
    assert.ok(isListOpen(fake));
    exitShowsAtOnce(fake, buttons.achievements);

    choose(fake, buttons.household);
    untilHouseholdStatsFadedIn(fake);
    exitShowsAtOnce(fake, buttons.household);

    choose(fake, buttons.frame);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.ok(isFrameListOpen(fake));
    exitOpensAgain(fake, buttons.frame);
    assertNoErrorLogged(fake);
});
