// ============================================================
// Christmas as a Profile's first Avatar Frame, through main.js on the fake
// PinballY globals: its toast is followed by the Reward Prompt, whose
// "Go equip it" opens the frame list scrolled to the Christmas row, last of
// the Holiday Frames; equipping it saves its text id
// and the badge wears it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, play, profileFile, TABLES, MINUTE, ALL_TOASTS_MS, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { settle } from "../support/fake_pinbally_host.js";
import { isFrameListOpen, frameRows, highlightedRow, press, PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { rewardPrompts, promptOf } from "../reward_prompt/reward_prompt_reader.js";
import { shownFrame } from "./avatar_frame_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const BADGE_Z = 4500;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands", "profilePicker"];
const CHRISTMAS_DAY = new Date(2026, 11, 25, 16, 0, 0);
const savedData = fake => JSON.parse(fake.readFile(profileFile("guest")));

test("Christmas as a first frame: the Reward Prompt's Go equip it lands on its row, and the badge wears it", async () => {
    const fake = await startScenario({ addOns: ADD_ONS, frameImages: true, now: CHRISTMAS_DAY });
    fake.advanceTime(DRAWN_AHEAD_MS);

    await play(fake, TABLES[0], 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    await settle();
    assert.deepEqual(rewardPrompts(fake), [promptOf("Christmas")]);

    fake.selectMenuItem("Go equip it");
    await settle();
    assert.equal(isFrameListOpen(fake), true);
    assert.equal(highlightedRow(fake), "Christmas");
    const rows = frameRows(fake);
    const christmas = rows.findIndex(row => row.name === "Christmas");
    // The Collection Tier rows above are scrolled out of view.
    assert.deepEqual(rows.slice(christmas - 9).map(row => row.name), ["New Year's Day", "Valentine's Day", "Mardi Gras",
        "St. Patrick's Day", "Easter", "Fête de la Musique", "Halloween", "Día de los Muertos", "Thanksgiving", "Christmas", "None"],
        "the Holiday Frames in the year's order, Christmas last, before None");
    assert.deepEqual(rows[christmas].frame, "frame_christmas_192.png");

    press(fake, "Select");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(savedData(fake).avatarFrame, "christmas");
    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    const badgeFrame = shownFrame(fake.drawingLayers().find(layer => layer.zIndex === BADGE_Z));
    assert.deepEqual(badgeFrame && [badgeFrame.tier, badgeFrame.size], ["christmas", 192]);
    assertNoErrorLogged(fake);
});
