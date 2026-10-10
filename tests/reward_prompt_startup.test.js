// ============================================================
// The Reward Prompt at startup, through main.js on the fake PinballY
// globals: a Profile that kept a Collection Tier from before the Avatar
// Frames, without "avatarFrame", gets its prompt once the Welcome Screen
// closes, naming its newest frame, and still wears nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, profileFile } from "./mastery_bar_scenario.js";
import { settle } from "./fake_pinbally_host.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen, press } from "./welcome_screen_reader.js";
import { rewardPrompts, promptOf } from "./reward_prompt_reader.js";

const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands", "startupChoicePrompt"];
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("an existing Profile with a Collection Tier gets its prompt after the Welcome Screen", async () => {
    const fake = await startScenario({ addOns: ADD_ONS, profiles: { guest: { collectionTier: 2 } } });
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(rewardPrompts(fake), [], "not over the Welcome Screen");

    press(fake, "Exit");
    await settle();
    assert.deepEqual(rewardPrompts(fake), [promptOf("Steam and Gears")]);
    assert.equal(savedData(fake, "guest").avatarFrame, null, "nothing worn");
    assert.deepEqual(errorLines(fake), []);
});
