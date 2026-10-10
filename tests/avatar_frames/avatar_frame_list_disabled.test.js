// ============================================================
// The Profile Stats without the Table Mastery Add-on, through main.js on
// the fake PinballY globals: no Collection Tier is kept, so there are no
// Avatar Frames and no Frame button, whatever profile.json holds.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { openProfileStats, buttons } from "../stats/profile_stats_reader.js";

test("with Table Mastery off, the Profile Stats offer no Frame button", async () => {
    const fake = await startScenario({
        addOns: ["achievements", "customMenuCommands"], frameImages: true, profiles: { guest: { collectionTier: 4, avatarFrame: 2 } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../../common/i18n.js");
    openProfileStats(fake, lang);

    assert.deepEqual(buttons(fake).map(button => button.label), ["Achievements"]);
    assert.deepEqual(errorLines(fake), []);
});
