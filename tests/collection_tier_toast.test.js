// ============================================================
// A Play that raises the Collection Tier, through main.js on the fake
// PinballY globals: it is kept in profile.json (absent before) and
// announced once by a Mastery Toast with one Confetti Shower; a Profile
// Reset drops it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, collectionToasts, savedCollectionTier, showerStarts, play, errorLines, playedFor, TABLES, MINUTE, ONE_TOAST_MS,
} from "./mastery_bar_scenario.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const levelOne = playedFor(MINUTE);

test("a Play that raises the Collection Tier keeps it and announces it with one Confetti Shower", async () => {
    const fake = await startScenario({ profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne } } } });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, THIRD, MINUTE);
    fake.advanceTime(ONE_TOAST_MS);
    assert.deepEqual(collectionToasts(fake), [], "three of four tables reach no tier");
    assert.equal(savedCollectionTier(fake, "guest"), undefined, "no key before a tier is reached");

    await play(fake, FOURTH, MINUTE);
    fake.advanceTime(ONE_TOAST_MS);
    assert.deepEqual(collectionToasts(fake), ["1 | COLLECTION MASTERY | Tier 1: Rookie | 4 tables at Rookie or above | New frame: Enchanted Forest"]);
    assert.equal(savedCollectionTier(fake, "guest"), 1);
    assert.equal(showerStarts(fake), 1);

    await play(fake, FOURTH, MINUTE);
    fake.advanceTime(ONE_TOAST_MS);
    assert.equal(collectionToasts(fake).length, 1, "a tier is announced once");

    const { getProfileStore } = await import("../common/profile_store.js");
    getProfileStore().resetProfile("guest");
    assert.equal(savedCollectionTier(fake, "guest"), undefined, "a Profile Reset drops it");
    assert.deepEqual(errorLines(fake), []);
});
