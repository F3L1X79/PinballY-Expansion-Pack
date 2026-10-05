// ============================================================
// A Child Profile's Collection Tier, through main.js on the fake PinballY
// globals: the Adult Tables it cannot see do not count.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, collectionToasts, savedCollectionTier, play, errorLines, playedFor, TABLES, MINUTE, ONE_TOAST_MS,
} from "./mastery_bar_scenario.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const levelOne = playedFor(MINUTE);

test("a Child Profile's Collection Tier counts only the tables it can see", async () => {
    const adultTable = { ...FIRST, id: 5, configId: "Adult Table (Bally 1990)", title: "Adult Table", categories: ["NSFW"] };
    const fake = await startScenario({
        tables: [...TABLES, adultTable],
        addOns: ["tableMastery", "profilePicker"],
        active: "Alice",
        profiles: { Alice: { isChild: true, plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } },
    });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, FOURTH, MINUTE);
    fake.advanceTime(ONE_TOAST_MS);

    assert.deepEqual(collectionToasts(fake), ["1 | COLLECTION MASTERY | Tier 1: Rookie | 4 tables at Rookie or above"]);
    assert.equal(savedCollectionTier(fake, "Alice"), 1);
    assert.deepEqual(errorLines(fake), []);
});
