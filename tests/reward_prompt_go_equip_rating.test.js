// ============================================================
// "Go equip it" with a rating prompt waiting, through main.js on the fake
// PinballY globals: the rating prompt shows neither over the frame list
// nor over the Profile Stats that Exit there goes back to, only once the
// player is back on the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, errorLines, playedFor, TABLES, MINUTE, LIT_MS, ONE_TOAST_MS, DRAWN_AHEAD_MS,
} from "./mastery_bar_scenario.js";
import { settle } from "./fake_pinbally_host.js";
import { isFrameListOpen, isProfileStatsOpen, press, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { REWARD_PROMPT_ID } from "./reward_prompt_reader.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands", "ratingPrompt"];
const levelOne = playedFor(MINUTE);
const shownIds = fake => fake.shownMenus().map(menu => menu.id);

test("a waiting rating prompt shows only once the player is back on the wheel after Go equip it", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, frameImages: true, settings: { askToRateAfterMinutesPlayed: 1 },
        profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const game = fake.getGameInfo(FOURTH.id);
    fake.playGame(game);
    fake.gameStarted(game);
    await settle();
    fake.advanceTime(2 * MINUTE * 1000);
    game.playTime = 2 * MINUTE;
    fake.gameOver(game);
    await settle();
    fake.advanceTime(LIT_MS);
    await settle();
    fake.advanceTime(ONE_TOAST_MS);
    await settle();
    assert.deepEqual(shownIds(fake), [REWARD_PROMPT_ID], "the rating prompt waits for the Reward Prompt");

    fake.selectMenuItem("Go equip it");
    await settle();
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    await settle();
    assert.equal(isFrameListOpen(fake), true);
    assert.deepEqual(shownIds(fake), [REWARD_PROMPT_ID], "not over the frame list");

    press(fake, "Exit");
    await settle();
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    await settle();
    assert.equal(isProfileStatsOpen(fake), true);
    assert.deepEqual(shownIds(fake), [REWARD_PROMPT_ID], "not over the Profile Stats");

    press(fake, "Exit");
    await settle();
    assert.equal(isProfileStatsOpen(fake), false);
    assert.deepEqual(shownIds(fake), [REWARD_PROMPT_ID, "ratingPrompt"], "back on the wheel");
    assert.deepEqual(errorLines(fake), []);
});
