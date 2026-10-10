// ============================================================
// A stale Mastery Toast brings no Reward Prompt, through main.js on the
// fake PinballY globals: when another Profile is active by the toast's
// turn, neither the toast nor the prompt of the Profile that played shows.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, collectionToasts, errorLines, playedFor, profileFile, TABLES, MINUTE, ALL_TOASTS_MS } from "./mastery_bar_scenario.js";
import { settle } from "./fake_pinbally_host.js";
import { rewardPrompts } from "./reward_prompt_reader.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands"];
const levelOne = playedFor(MINUTE);
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("a toast gone stale by its turn submits no prompt", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, profiles: {
            guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } },
            alice: {},
        },
    });
    const { getProfileStore } = await import("../common/profile_store.js");
    fake.advanceTime(ALL_TOASTS_MS);

    fake.playGame(FOURTH);
    fake.gameStarted(FOURTH);
    fake.advanceTime(MINUTE * 1000);
    // The Play is announced while the game exits: its toast waits for the wheel.
    fake.fire("gameover", { game: FOURTH });
    getProfileStore().switchTo("alice");
    fake.gameOver(FOURTH);
    await settle();
    fake.advanceTime(ALL_TOASTS_MS);
    await settle();

    assert.deepEqual(collectionToasts(fake), []);
    assert.deepEqual(rewardPrompts(fake), []);
    assert.equal("avatarFrame" in savedData(fake, "guest"), false, "Guest's prompt is still to come");
    assert.deepEqual(errorLines(fake), []);
});
