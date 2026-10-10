// ============================================================
// Collection Mastery's values, from the Mastery Levels of the tables a
// Profile can see (0 for a table never played): the Collection Tier, how
// many tables reached the next one and how many it needs; a tier kept in
// profile.json still counts once the tables no longer reach it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { collectionMasteryOf } from "../../common/table_mastery.js";

const times = (count, level) => Array(count).fill(level);

test("no table to see gives tier 0 and 0 out of 10", () => {
    assert.deepEqual(collectionMasteryOf([]), { tier: 0, reached: 0, needed: 10 });
});

test("a Profile that sees fewer than ten tables needs all of them", () => {
    assert.deepEqual(collectionMasteryOf([3, 2, 0]), { tier: 0, reached: 2, needed: 3 });
    assert.deepEqual(collectionMasteryOf([3, 2, 2]), { tier: 2, reached: 1, needed: 3 });
});

test("tier 0, a middle tier and tier 10", () => {
    assert.deepEqual(collectionMasteryOf([...times(7, 1), ...times(20, 0)]), { tier: 0, reached: 7, needed: 10 });
    assert.deepEqual(collectionMasteryOf([...times(4, 6), ...times(6, 4), ...times(5, 2)]), { tier: 4, reached: 4, needed: 10 });
    assert.deepEqual(collectionMasteryOf([...times(10, 10), 3]), { tier: 10, reached: 10, needed: 10 });
});

test("a tier kept from before counts when the tables no longer reach it", () => {
    assert.deepEqual(collectionMasteryOf([...times(9, 3), 1], 3), { tier: 3, reached: 0, needed: 10 });
    assert.deepEqual(collectionMasteryOf([...times(10, 5)], 3), { tier: 5, reached: 0, needed: 10 });
});
