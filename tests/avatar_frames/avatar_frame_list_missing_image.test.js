// ============================================================
// An Avatar Frame image missing from the install, through main.js on the
// fake PinballY globals: it is logged and the list's row shows the plain
// Avatar, the list working as usual.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, AVATAR_FRAMES_FOLDER, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { openProfileStats, choose, frameRows } from "../stats/profile_stats_reader.js";

const DEFAULT_AVATAR = "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\default_avatar.png";

test("a missing frame image is logged and its row shows the plain Avatar", async () => {
    const fake = await startScenario({ addOns: ["tableMastery", "achievements", "customMenuCommands"], profiles: { guest: { collectionTier: 1 } } });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../../common/i18n.js");
    openProfileStats(fake, lang);
    choose(fake, "Frame");

    assert.deepEqual(frameRows(fake)[0], { name: "Enchanted Forest", status: null, frame: null, avatar: DEFAULT_AVATAR });
    assert.ok(fake.logLines().some(line => line.includes("not found") && line.includes(`${AVATAR_FRAMES_FOLDER}\\frame_01_192.png`)));
    assert.deepEqual(errorLines(fake), []);
});
