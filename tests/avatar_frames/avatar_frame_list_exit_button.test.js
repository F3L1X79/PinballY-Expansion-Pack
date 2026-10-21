// ============================================================
// The Avatar Frame list's Exit Button (the back arrow), through main.js
// on the fake PinballY globals: the list still opens on the worn row; Prev
// from the first row, or Next from the last, selects the button, its tooltip saying Back and the
// Selection Marker round it; Next from it goes to the first row; Select
// on it goes back to the Profile Stats on "Avatar Frames", the worn frame unchanged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import {
    openProfileStats, choose, press, highlighted, isProfileStatsOpen, isFrameListOpen, highlightedRow, untilFrameListShown, PROFILE_STATS_OPEN_MS,
} from "../stats/profile_stats_reader.js";
import { highlightedChoice, isMarkerOnExitButton } from "./avatar_frame_list_reader.js";

test("the Exit Button comes first in the loop and goes back to the Profile Stats on Frame", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands"], frameImages: true, profiles: { guest: { collectionTier: 3 } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../../common/core/i18n.js");
    openProfileStats(fake, lang);
    choose(fake, "Avatar Frames");
    untilFrameListShown(fake);

    assert.equal(highlightedChoice(fake), "None", "opens on the worn row");
    assert.equal(isMarkerOnExitButton(fake), false);
    press(fake, "Next");
    assert.equal(highlightedChoice(fake), lang.buttonHints.back, "Next from the last row loops onto the Exit Button");
    press(fake, "Next");
    assert.equal(highlightedChoice(fake), "Enchanted Forest");
    press(fake, "Prev");
    assert.equal(highlightedChoice(fake), lang.buttonHints.back, "Prev from the first row selects the Exit Button");
    assert.equal(isMarkerOnExitButton(fake), true, "the Selection Marker surrounds it");
    assert.equal(highlightedRow(fake), null, "no row highlighted");
    press(fake, "Next");
    assert.equal(highlightedChoice(fake), "Enchanted Forest", "Next from it goes to the first row");

    press(fake, "Prev");
    const select = press(fake, "Select");
    assert.ok(select.defaultPrevented, "Select never reaches the wheel");
    assert.equal(isFrameListOpen(fake), false);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(isProfileStatsOpen(fake), true);
    assert.equal(highlighted(fake), "Avatar Frames", "back on the Frame button");

    choose(fake, "Avatar Frames");
    untilFrameListShown(fake);
    assert.equal(highlightedChoice(fake), "None", "the worn frame unchanged");
    assertNoErrorLogged(fake);
});
