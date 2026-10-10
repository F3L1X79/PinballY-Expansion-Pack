// ============================================================
// "Go equip it" in the Reward Prompt, through main.js on the fake
// PinballY globals: it opens the Profile Stats' frame list on the frame
// just won, not on the worn row; Exit there shows the Profile Stats on
// the Frame button, and nothing is worn. No dialog opens over the list.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, play, errorLines, playedFor, profileFile, TABLES, MINUTE, ALL_TOASTS_MS, DRAWN_AHEAD_MS,
} from "../mastery/mastery_bar_scenario.js";
import { settle } from "../support/fake_pinbally_host.js";
import { isFrameListOpen, isProfileStatsOpen, highlightedRow, highlighted, press, PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { rewardPrompts } from "./reward_prompt_reader.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands"];
const levelOne = playedFor(MINUTE);
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("Go equip it opens the frame list on the new frame; Exit goes back to the Profile Stats on Frame", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, frameImages: true,
        profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    await play(fake, FOURTH, MINUTE);
    await settle();
    assert.equal(rewardPrompts(fake).length, 1);

    fake.selectMenuItem("Go equip it");
    await settle();
    assert.equal(fake.currentMenu(), null);
    assert.equal(isFrameListOpen(fake), true);
    assert.equal(highlightedRow(fake), "Enchanted Forest", "on the frame just won, not on None");
    fake.advanceTime(ALL_TOASTS_MS);
    await settle();
    assert.equal(fake.currentMenu(), null, "no dialog over the list");

    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(isFrameListOpen(fake), false);
    assert.equal(isProfileStatsOpen(fake), true);
    assert.equal(highlighted(fake), "Frame");
    assert.equal(savedData(fake, "guest").avatarFrame, null, "nothing worn");
    assert.deepEqual(errorLines(fake), []);
});
