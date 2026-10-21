// ============================================================
// The Avatar Frame list's Selection Marker, through main.js on the fake
// PinballY globals: the marker surrounds the worn row on opening, follows
// Next and Prev (looping through the Exit Button), and is gone, with its timer, once Select, Exit
// or attract mode closes the list.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import {
    openProfileStats, choose, press, isProfileStatsOpen, isFrameListOpen, highlightedRow, frameListMarkerLayerCount, PROFILE_STATS_OPEN_MS,
    untilFrameListShown,
} from "../stats/profile_stats_reader.js";

test("the Selection Marker surrounds the worn row, follows the moves and is gone once the list closes", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands"], frameImages: true, profiles: { guest: { collectionTier: 3 } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../../common/core/i18n.js");
    const intervalsBefore = fake.runningIntervalCount();
    const reopenList = () => {
        openProfileStats(fake, lang);
        choose(fake, "Avatar Frames");
        untilFrameListShown(fake);
        assert.equal(isFrameListOpen(fake), true);
    };
    const closeProfileStats = () => {
        fake.advanceTime(PROFILE_STATS_OPEN_MS);
        press(fake, "Exit");
        assert.equal(isProfileStatsOpen(fake), false);
    };

    reopenList();
    assert.equal(frameListMarkerLayerCount(fake), 1, "a single marker");
    assert.equal(highlightedRow(fake), "None", "round the worn row on opening");
    press(fake, "Next");
    assert.equal(highlightedRow(fake), null, "Next loops onto the Exit Button");
    press(fake, "Next");
    assert.equal(highlightedRow(fake), "Enchanted Forest", "then the first row");
    press(fake, "Next");
    assert.equal(highlightedRow(fake), "Steam and Gears");
    press(fake, "Prev");
    press(fake, "Prev");
    press(fake, "Prev");
    assert.equal(highlightedRow(fake), "None", "Prev loops back");
    assert.equal(frameListMarkerLayerCount(fake), 1, "still a single marker");

    press(fake, "Next");
    press(fake, "Next");
    press(fake, "Select");
    assert.equal(isFrameListOpen(fake), false);
    assert.equal(frameListMarkerLayerCount(fake), 0, "removed on Select");
    closeProfileStats();
    assert.equal(fake.runningIntervalCount(), intervalsBefore, "no timer of the marker keeps running");

    reopenList();
    assert.equal(highlightedRow(fake), "Enchanted Forest", "round the newly worn row");
    press(fake, "Exit");
    assert.equal(frameListMarkerLayerCount(fake), 0, "removed on Exit");
    closeProfileStats();
    assert.equal(fake.runningIntervalCount(), intervalsBefore);

    reopenList();
    fake.fire("attractmodestart", {});
    assert.equal(isFrameListOpen(fake), false);
    assert.equal(frameListMarkerLayerCount(fake), 0, "removed on attract mode");
    assert.equal(fake.runningIntervalCount(), intervalsBefore);
    assertNoErrorLogged(fake);
});
