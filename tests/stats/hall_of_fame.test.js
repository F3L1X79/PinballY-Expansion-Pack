// ============================================================
// Hall of Fame behaviour, through the Hall of Fame module's interface:
// which tables it holds and in which order, from a Profile's play time and
// play count of each table. Run with "node --test" from the project folder.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { getHallOfFame } from "../../common/hall_of_fame.js";

const HOUR = 3600;

// PinballY's own play stats are wrong on purpose: only the Profile's play
// record counts.
function table(title, { playTime = 0, playCount = 0, isHidden = false, isConfigured = true } = {}) {
    return {
        id: title, configId: title, title, isHidden, isConfigured,
        playTime: 1000 * HOUR, playCount: 1000,
        profilePlay: { count: playCount, seconds: playTime, lastPlayed: "" },
    };
}

const NO_PLAY = { count: 0, seconds: 0, lastPlayed: "" };

// The Profile's play record of those tables.
function getHallOfFameOf(tables) {
    const getPlay = configId => tables.find(game => game.configId === configId)?.profilePlay ?? NO_PLAY;
    return getHallOfFame(tables, getPlay);
}

const titles = tables => tables.map(game => game.title);

test("ranks the tables from the most play time to the least", () => {
    const tables = [
        table("Attack from Mars", { playTime: 2 * HOUR, playCount: 30 }),
        table("Medieval Madness", { playTime: 5 * HOUR, playCount: 10 }),
        table("Theatre of Magic", { playTime: 3 * HOUR, playCount: 50 }),
    ];

    assert.deepEqual(titles(getHallOfFameOf(tables)),
        ["Medieval Madness", "Theatre of Magic", "Attack from Mars"]);
});

test("holds the ten most played tables only", () => {
    const tables = Array.from({ length: 12 }, (_, index) =>
        table(`Table ${index + 1}`, { playTime: (index + 1) * HOUR, playCount: 1 }));

    assert.deepEqual(titles(getHallOfFameOf(tables)),
        ["Table 12", "Table 11", "Table 10", "Table 9", "Table 8",
            "Table 7", "Table 6", "Table 5", "Table 4", "Table 3"]);
});

test("breaks a play time tie by play count, then by title", () => {
    const tables = [
        table("Twilight Zone", { playTime: HOUR, playCount: 4 }),
        table("Scared Stiff", { playTime: HOUR, playCount: 9 }),
        table("Black Knight", { playTime: HOUR, playCount: 4 }),
    ];

    assert.deepEqual(titles(getHallOfFameOf(tables)),
        ["Scared Stiff", "Black Knight", "Twilight Zone"]);
});

test("leaves out the tables never played, even when fewer than ten were played", () => {
    const tables = [
        table("Medieval Madness", { playTime: HOUR, playCount: 1 }),
        table("Fish Tales"),
    ];

    assert.deepEqual(titles(getHallOfFameOf(tables)), ["Medieval Madness"]);
});

test("ranks the visible, configured tables only, so the others take no place", () => {
    const tables = [
        table("Hidden Favourite", { playTime: 100 * HOUR, playCount: 1, isHidden: true }),
        table("Unconfigured Favourite", { playTime: 90 * HOUR, playCount: 1, isConfigured: false }),
        ...Array.from({ length: 10 }, (_, index) =>
            table(`Table ${index + 1}`, { playTime: (index + 1) * HOUR, playCount: 1 })),
    ];

    assert.deepEqual(titles(getHallOfFameOf(tables)),
        ["Table 10", "Table 9", "Table 8", "Table 7", "Table 6",
            "Table 5", "Table 4", "Table 3", "Table 2", "Table 1"]);
});
