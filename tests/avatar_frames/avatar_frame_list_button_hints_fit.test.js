// ============================================================
// The Avatar Frame list's Button Hints and Exit Button in landscape and
// portrait windows, through main.js on the fake PinballY globals: the
// footer sits inside the window, under every row, hiding none of them,
// its words inside it; the Exit Button sits above the rows, inside the window.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { openProfileStats, choose, press, untilFrameListShown, isProfileStatsOpen, PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { frameListFooterLayout } from "./avatar_frame_list_reader.js";

const WINDOWS = [{ width: 1920, height: 1080 }, { width: 1080, height: 1920 }];

test("the footer fits under the rows in landscape and portrait", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands"], frameImages: true, profiles: { guest: { collectionTier: 3 } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../../common/core/i18n.js");
    for (const size of WINDOWS) {
        fake.setLayoutSize(size);
        fake.advanceTime(DRAWN_AHEAD_MS);
        openProfileStats(fake, lang);
        choose(fake, "Frame");
        untilFrameListShown(fake);
        const { footer, rows, exitButton, textsInside } = frameListFooterLayout(fake, size);
        const where = `${size.width}x${size.height}`;
        assert.equal(rows.length, 11, `${where}: every row shows`);
        assert.ok(footer.top >= 0 && footer.bottom <= size.height && footer.left >= 0 && footer.right <= size.width, `${where}: inside the window`);
        for (const row of rows) assert.ok(row.bottom <= footer.top + 0.5, `${where}: under the rows`);
        assert.ok(textsInside, `${where}: its words inside it`);
        assert.ok(exitButton.top >= 0 && exitButton.right <= size.width, `${where}: the Exit Button inside the window`);
        for (const row of rows) assert.ok(exitButton.bottom <= row.top + 0.5, `${where}: the Exit Button above the rows`);
        press(fake, "Exit");
        fake.advanceTime(PROFILE_STATS_OPEN_MS);
        press(fake, "Exit");
        fake.advanceTime(PROFILE_STATS_OPEN_MS);
        assert.equal(isProfileStatsOpen(fake), false);
    }
    assertNoErrorLogged(fake);
});
