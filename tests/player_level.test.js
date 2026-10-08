// ============================================================
// The pure Player Level module: the level curve from points, and a Child
// Profile's points scaled up by what the Achievements of a Profile that is
// not a child would be worth, rounded down; factor 1 without that set or
// when the current set is worth nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { getPlayerLevel, playerLevelOf } from "../common/player_level.js";
import { ACHIEVEMENT_RANK } from "../common/achievements.js";

const achievement = (id, rank) => ({ id, rank });
const BRONZE = achievement("bronze", ACHIEVEMENT_RANK.BRONZE);
const SILVER = achievement("silver", ACHIEVEMENT_RANK.SILVER);
const GOLD = achievement("gold", ACHIEVEMENT_RANK.GOLD);
const PLATINUM = achievement("platinum", ACHIEVEMENT_RANK.PLATINUM);

test("the level curve: level 2 at 50 points, then 25 more each level", () => {
    assert.deepEqual(playerLevelOf(0), { level: 1, points: 0, from: 0, to: 50 });
    assert.deepEqual(playerLevelOf(50), { level: 2, points: 50, from: 50, to: 125 });
    assert.deepEqual(playerLevelOf(125), { level: 3, points: 125, from: 125, to: 225 });
});

test("without a non-child set, the points are the Notified Achievements' own", () => {
    assert.deepEqual(getPlayerLevel(["bronze", "silver"], [BRONZE, SILVER, GOLD]), playerLevelOf(35));
    assert.deepEqual(getPlayerLevel(["bronze", "silver"], [BRONZE, SILVER, GOLD], null), playerLevelOf(35));
});

test("with a non-child set, the points are scaled by its worth over the current set's, rounded down", () => {
    // Current set 85 points, non-child set 85 + 100: 35 × 185 / 85 = 76.17.
    const scaled = getPlayerLevel(["bronze", "silver"], [BRONZE, SILVER, GOLD], [BRONZE, SILVER, GOLD, PLATINUM]);
    assert.deepEqual(scaled, playerLevelOf(76));
});

test("a non-child set worth the same as the current set changes nothing", () => {
    assert.deepEqual(getPlayerLevel(["gold"], [BRONZE, GOLD], [GOLD, BRONZE]), playerLevelOf(50));
});

test("a current set worth nothing keeps the factor at 1", () => {
    assert.deepEqual(getPlayerLevel([], [], [GOLD, PLATINUM]), playerLevelOf(0));
});
