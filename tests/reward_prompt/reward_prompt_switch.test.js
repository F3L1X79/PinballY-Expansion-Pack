// ============================================================
// The Reward Prompt on a Profile switch, through main.js on the fake
// PinballY globals: a Profile already prompted gets none, and switching
// to one whose first frame is pending gives it its own prompt, kept in
// its own profile.json.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, profileFile, ALL_TOASTS_MS } from "../mastery/mastery_bar_scenario.js";
import { settle } from "../support/fake_pinbally_host.js";
import { rewardPrompts, promptOf } from "./reward_prompt_reader.js";

const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands", "profilePicker"];
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("switching to a Profile whose first frame is pending gives it its own prompt", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, profiles: { guest: { collectionTier: 3, avatarFrame: null }, alice: { collectionTier: 1 } },
    });
    const { getProfileStore } = await import("../../common/profile_store.js");
    fake.advanceTime(ALL_TOASTS_MS);
    await settle();
    assert.deepEqual(rewardPrompts(fake), [], "Guest was already prompted");

    getProfileStore().switchTo("alice");
    await settle();
    fake.advanceTime(ALL_TOASTS_MS);
    await settle();
    assert.deepEqual(rewardPrompts(fake), [promptOf("Enchanted Forest")]);
    assert.equal(savedData(fake, "alice").avatarFrame, null);
    assert.equal(savedData(fake, "guest").avatarFrame, null);
    assert.deepEqual(errorLines(fake), []);
});
