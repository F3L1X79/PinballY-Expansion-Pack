// ============================================================
// The Reward Prompt and the rating prompt of the same game, through
// main.js on the fake PinballY globals: the rating prompt waits for the
// Mastery Toast's line and the Reward Prompt it brings, which never
// shows during the game.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, playedFor, TABLES, MINUTE, LIT_MS, ONE_TOAST_MS, ALL_TOASTS_MS } from "./mastery_bar_scenario.js";
import { settle } from "./fake_pinbally_host.js";
import { REWARD_PROMPT_ID } from "./reward_prompt_reader.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands", "ratingPrompt"];
const levelOne = playedFor(MINUTE);

test("the Reward Prompt comes before the rating prompt of the same game, never during a game", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, settings: { askToRateAfterMinutesPlayed: 1 },
        profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } },
    });
    fake.advanceTime(ALL_TOASTS_MS);
    await settle();

    const game = fake.getGameInfo(FOURTH.id);
    fake.playGame(game);
    fake.gameStarted(game);
    await settle();
    fake.advanceTime(2 * MINUTE * 1000);
    game.playTime = 2 * MINUTE;
    fake.gameOver(game);
    await settle();
    assert.deepEqual(fake.shownMenus(), [], "the rating prompt waits for the Reward Prompt");
    fake.advanceTime(LIT_MS);
    await settle();
    assert.deepEqual(fake.shownMenus().map(menu => menu.id), [REWARD_PROMPT_ID], "the toast's line shows, then the prompt, the rating prompt waiting");
    fake.advanceTime(ONE_TOAST_MS);
    await settle();
    assert.deepEqual(fake.shownMenus().map(menu => menu.id), [REWARD_PROMPT_ID]);

    fake.closeMenu();
    await settle();
    assert.deepEqual(fake.shownMenus().map(menu => menu.id), [REWARD_PROMPT_ID, "ratingPrompt"]);
    assert.deepEqual(errorLines(fake), []);
});
