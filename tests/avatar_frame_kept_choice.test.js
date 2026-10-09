// ============================================================
// A recorded Avatar Frame choice outlives a new Collection Tier, through
// main.js on the fake PinballY globals: the new tier's Mastery Toast
// names its frame, which the list then offers unlocked, but the Profile
// keeps wearing what it chose, and "None" stays "None".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, collectionToasts, play, errorLines, playedFor, profileFile, TABLES, MINUTE, ONE_TOAST_MS, DRAWN_AHEAD_MS,
} from "./mastery_bar_scenario.js";
import { openProfileStats, choose, frameRows, press } from "./profile_stats_reader.js";
import { getProfileStore } from "../common/profile_store.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands", "profilePicker"];
// Three tables at Mastery Level 2, the fourth at 1: a half-hour Play on it
// reaches Collection Tier 2.
const NEAR_TIER_TWO = {
    collectionTier: 1,
    plays: { [FIRST.configId]: playedFor(30 * MINUTE), [SECOND.configId]: playedFor(30 * MINUTE), [THIRD.configId]: playedFor(30 * MINUTE), [FOURTH.configId]: playedFor(MINUTE) },
};
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));
const wornRow = fake => frameRows(fake).find(row => row.status === "Worn").name;

test("a new Collection Tier announces its frame but keeps the recorded choice, None included", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, frameImages: true,
        profiles: { guest: { ...NEAR_TIER_TWO, avatarFrame: 1 }, mia: { ...NEAR_TIER_TWO, avatarFrame: null } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../common/i18n.js");

    await play(fake, FOURTH, 30 * MINUTE);
    fake.advanceTime(2 * ONE_TOAST_MS);
    assert.deepEqual(collectionToasts(fake).map(toast => toast.split(" | ").at(-1)), ["New frame: Steam and Gears"]);
    assert.equal(savedData(fake, "guest").avatarFrame, 1);
    openProfileStats(fake, lang);
    choose(fake, "Frame");
    assert.equal(wornRow(fake), "Enchanted Forest");
    assert.equal(frameRows(fake)[1].frame, "frame_02_192.png", "the new frame is offered unlocked");
    press(fake, "Exit");
    press(fake, "Exit");

    getProfileStore().switchTo("mia");
    fake.advanceTime(DRAWN_AHEAD_MS);
    await play(fake, FOURTH, 30 * MINUTE);
    fake.advanceTime(2 * ONE_TOAST_MS);
    assert.equal(savedData(fake, "mia").avatarFrame, null, "None stays None");
    openProfileStats(fake, lang);
    choose(fake, "Frame");
    assert.equal(wornRow(fake), "None");
    assert.deepEqual(errorLines(fake), []);
});
