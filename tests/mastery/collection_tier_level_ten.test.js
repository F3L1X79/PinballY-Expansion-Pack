// ============================================================
// Mastery Level 10 and a new Collection Tier in the same Play, through
// main.js on the fake PinballY globals: both Mastery Toasts show, with one
// Confetti Shower.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, masteryToasts, collectionToasts, savedCollectionTier, showerStarts, play, errorLines, playedFor, TABLES, MINUTE, ONE_TOAST_MS,
} from "./mastery_bar_scenario.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;

test("Mastery Level 10 and a new Collection Tier in the same Play bring both toasts and one shower", async () => {
    const mastered = playedFor(43200);
    const fake = await startScenario({
        profiles: { guest: { plays: {
            [FIRST.configId]: mastered, [SECOND.configId]: mastered, [THIRD.configId]: mastered, [FOURTH.configId]: playedFor(43100),
        } } },
    });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, FOURTH, 2 * MINUTE);
    fake.advanceTime(2 * ONE_TOAST_MS);

    assert.deepEqual(masteryToasts(fake), ["10 | TABLE MASTERY | Pinball Wizard (10) | Twilight Zone"]);
    assert.deepEqual(collectionToasts(fake), ["10 | COLLECTION MASTERY | Tier 10: Pinball Wizard | 4 tables at Pinball Wizard or above | New frames: "
        + "Enchanted Forest, Steam and Gears, Arcade Neon, Eternal Frost, Spice of Arrakis, "
        + "Arcane Grimoire, Orbital Station, Dragon's Breath, Royal Pinball, Celestial Legend"]);
    assert.equal(showerStarts(fake), 1);
    assert.equal(savedCollectionTier(fake, "guest"), 10);
    assert.deepEqual(errorLines(fake), []);
});
