// ============================================================
// The Avatar Frame list of the Profile Stats, through main.js on the fake
// PinballY globals: the card's Frame button opens a list of the ten
// frames in tier order around the player's own Avatar, then "None",
// locked ones greyed with their unlock condition, opened on the worn row.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { openProfileStats, buttons, choose, isProfileStatsOpen, isFrameListOpen, frameRows, highlightedRow } from "../stats/profile_stats_reader.js";

const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands"];
const DEFAULT_AVATAR = "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\default_avatar.png";

test("the Frame button opens the ten frames then None, the locked ones greyed with their condition", async () => {
    const fake = await startScenario({ addOns: ADD_ONS, frameImages: true, profiles: { guest: { collectionTier: 3 } } });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../../common/i18n.js");
    openProfileStats(fake, lang);

    assert.deepEqual(buttons(fake).slice(0, 2), [
        { label: "Achievements", count: buttons(fake)[0].count },
        { label: "Frame", count: "3/10" },
    ], "the Frame button comes right after the Achievements one, with the frames unlocked");

    choose(fake, "Frame");

    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(isFrameListOpen(fake), true);
    assert.deepEqual(frameRows(fake).map(({ name, status, frame }) => [name, status, frame]), [
        ["Enchanted Forest", null, "frame_01_192.png"],
        ["Steam and Gears", null, "frame_02_192.png"],
        ["Arcade Neon", null, "frame_03_192.png"],
        ["Eternal Frost", "Collection Tier 4", "frame_04_192_locked.png"],
        ["Spice of Arrakis", "Collection Tier 5", "frame_05_192_locked.png"],
        ["Arcane Grimoire", "Collection Tier 6", "frame_06_192_locked.png"],
        ["Orbital Station", "Collection Tier 7", "frame_07_192_locked.png"],
        ["Dragon's Breath", "Collection Tier 8", "frame_08_192_locked.png"],
        ["Royal Pinball", "Collection Tier 9", "frame_09_192_locked.png"],
        ["Celestial Legend", "Collection Tier 10", "frame_10_192_locked.png"],
        ["None", "Worn", null],
    ]);
    assert.ok(frameRows(fake).every(row => row.avatar === DEFAULT_AVATAR), "every row shows the player's own Avatar");
    assert.equal(highlightedRow(fake), "None", "the list opens on what is worn");
    assert.deepEqual(errorLines(fake), []);
});
