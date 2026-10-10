// ============================================================
// The Reward Prompt after a Play, through main.js on the fake PinballY
// globals: the Play that brings a Profile's first Avatar Frame shows its
// toast line, then the prompt, which marks profile.json ("avatarFrame":
// null) without wearing anything; a later frame brings only its line.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, collectionToasts, play, errorLines, playedFor, profileFile, TABLES, MINUTE, ONE_TOAST_MS, ALL_TOASTS_MS,
} from "./mastery_bar_scenario.js";
import { settle } from "./fake_pinbally_host.js";
import { REWARD_PROMPT_ID, rewardPrompts, promptOf } from "./reward_prompt_reader.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands"];
const levelOne = playedFor(MINUTE);
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("the first frame's toast line comes first, then the Reward Prompt; a later frame brings only its line", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } },
    });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(rewardPrompts(fake), [], "no frame yet, no prompt");

    await play(fake, FOURTH, MINUTE);
    await settle();
    assert.deepEqual(collectionToasts(fake).map(toast => toast.split(" | ").pop()), ["New frame: Enchanted Forest"]);
    assert.deepEqual(rewardPrompts(fake), [promptOf("Enchanted Forest")]);
    assert.equal(fake.currentMenu().id, REWARD_PROMPT_ID);
    assert.equal(savedData(fake, "guest").avatarFrame, null, "shown: never again, and nothing worn");

    fake.selectMenuItem("Got it");
    fake.advanceTime(ALL_TOASTS_MS);
    assert.equal(fake.currentMenu(), null);

    // Every table to level 2 (Collection Tier 2): one more frame, no prompt.
    for (const game of [FIRST, SECOND, THIRD, FOURTH]) {
        await play(fake, game, 30 * MINUTE);
        fake.advanceTime(ONE_TOAST_MS);
        await settle();
    }
    fake.advanceTime(ALL_TOASTS_MS);
    assert.equal(collectionToasts(fake).at(-1).split(" | ").pop(), "New frame: Steam and Gears");
    assert.equal(rewardPrompts(fake).length, 1, "a later frame brings no prompt");
    assert.equal(savedData(fake, "guest").avatarFrame, null);
    assert.deepEqual(errorLines(fake), []);
});
