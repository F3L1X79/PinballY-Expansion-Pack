// ============================================================
// No Reward Prompt with the Table Mastery Add-on off, through main.js on
// the fake PinballY globals: a Profile that kept a Collection Tier has
// no frames then, so nothing is offered and profile.json is left alone.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, profileFile, ALL_TOASTS_MS } from "../mastery/mastery_bar_scenario.js";
import { settle } from "../support/fake_pinbally_host.js";
import { rewardPrompts } from "./reward_prompt_reader.js";

const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("no Reward Prompt with Table Mastery off", async () => {
    const fake = await startScenario({ addOns: ["achievements", "customMenuCommands"], profiles: { guest: { collectionTier: 2 } } });
    fake.advanceTime(ALL_TOASTS_MS);
    await settle();

    assert.deepEqual(rewardPrompts(fake), []);
    assert.equal("avatarFrame" in savedData(fake, "guest"), false);
    assert.deepEqual(errorLines(fake), []);
});
