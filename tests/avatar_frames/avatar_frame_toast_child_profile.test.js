// ============================================================
// A Child Profile's next Collection Tier, through main.js on the fake
// PinballY globals: its Mastery Toast names the next Avatar Frame, like
// any Profile's, and nothing is worn.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, collectionToasts, play, errorLines, playedFor, profileFile, TABLES, MINUTE, ONE_TOAST_MS,
} from "../mastery/mastery_bar_scenario.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("a Child Profile's next Collection Tier names the next Avatar Frame", async () => {
    const apprentice = playedFor(30 * MINUTE);
    const fake = await startScenario({
        addOns: ["tableMastery", "profilePicker"],
        active: "Alice",
        profiles: { Alice: { isChild: true, collectionTier: 1, plays: {
            [FIRST.configId]: apprentice, [SECOND.configId]: apprentice, [THIRD.configId]: apprentice, [FOURTH.configId]: playedFor(29 * MINUTE),
        } } },
    });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, FOURTH, 2 * MINUTE);
    fake.advanceTime(2 * ONE_TOAST_MS);

    assert.deepEqual(collectionToasts(fake), [
        "2 | COLLECTION MASTERY | Tier 2: Apprentice | 4 tables at Apprentice or above | New frame: Steam and Gears",
    ]);
    assert.equal(savedData(fake, "Alice").collectionTier, 2);
    assert.equal("avatarFrame" in savedData(fake, "Alice"), false);
    assert.deepEqual(errorLines(fake), []);
});
