// ============================================================
// The Reward Prompt and the Profile Reset, through main.js on the fake
// PinballY globals: once closed (Exit, as "Got it"), the prompt never
// comes back for that Profile; a Profile Reset drops "avatarFrame", so
// the next first frame brings it again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, play, errorLines, playedFor, profileFile, TABLES, MINUTE, ONE_TOAST_MS, ALL_TOASTS_MS } from "./mastery_bar_scenario.js";
import { settle } from "./fake_pinbally_host.js";
import { rewardPrompts, promptOf } from "./reward_prompt_reader.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands"];
const levelOne = playedFor(MINUTE);
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

async function playEach(fake, games) {
    for (const game of games) {
        await play(fake, game, MINUTE);
        fake.advanceTime(ONE_TOAST_MS);
        await settle();
    }
}

test("Exit closes the prompt for good, until a Profile Reset brings it again with the next first frame", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } },
    });
    const { getProfileStore } = await import("../common/profile_store.js");
    fake.advanceTime(ALL_TOASTS_MS);
    await playEach(fake, [FOURTH]);
    assert.equal(rewardPrompts(fake).length, 1);

    fake.closeMenu();
    await settle();
    await playEach(fake, [FIRST, SECOND]);
    assert.equal(rewardPrompts(fake).length, 1, "never again after Exit");
    assert.equal(savedData(fake, "guest").avatarFrame, null, "nothing worn");

    getProfileStore().resetProfile("guest");
    await settle();
    assert.equal("avatarFrame" in savedData(fake, "guest"), false);
    await playEach(fake, [FIRST, SECOND, THIRD, FOURTH]);
    assert.deepEqual(rewardPrompts(fake), [promptOf("Enchanted Forest"), promptOf("Enchanted Forest")]);
    assert.deepEqual(errorLines(fake), []);
});
