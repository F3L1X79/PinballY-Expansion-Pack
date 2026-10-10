// ============================================================
// An Avatar Frame announced by the Mastery Toast, through main.js on the
// fake PinballY globals: a Play that raises the Collection Tier adds one
// line naming that tier's frame to its toast, with no other toast, and
// writes nothing about the frame to profile.json.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, allToasts, collectionToasts, play, errorLines, playedFor, profileFile, TABLES, MINUTE, ONE_TOAST_MS,
} from "../mastery/mastery_bar_scenario.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const levelOne = playedFor(MINUTE);
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("a new Collection Tier's Mastery Toast names its Avatar Frame, and nothing is worn", async () => {
    const fake = await startScenario({ profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } } });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, FOURTH, MINUTE);
    fake.advanceTime(2 * ONE_TOAST_MS);

    assert.deepEqual(collectionToasts(fake), [
        "1 | COLLECTION MASTERY | Tier 1: Rookie | 4 tables at Rookie or above | New frame: Enchanted Forest",
    ]);
    assert.deepEqual(allToasts(fake), [
        "1 | TABLE MASTERY | Rookie (1) | Twilight Zone",
        "1 | COLLECTION MASTERY | Tier 1: Rookie | 4 tables at Rookie or above | New frame: Enchanted Forest",
    ], "no toast of its own for the frame");
    assert.equal(savedData(fake, "guest").collectionTier, 1);
    assert.equal("avatarFrame" in savedData(fake, "guest"), false, "the unlock writes nothing");
    assert.deepEqual(errorLines(fake), []);
});
