// ============================================================
// Lost Records with the High Scores Add-on turned off, through main.js on
// the fake PinballY globals: a Table Record taken in high_scores.json is
// never told, and the Welcome Screen writes no seen marker.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords } from "./lost_records_scenario.js";
import { MEDIEVAL, HIGH_SCORES_FILE } from "../high_scores/high_scores_scenario.js";

// Bob took Alice's record after her last Welcome Screen.
const HIGH_SCORES = {
    version: 1,
    tables: {},
    highScores: [
        { profile: "Bob", configId: MEDIEVAL, score: "70000000", initials: "BOB", place: 1, date: "2026-10-11T21:00:00", tableRecord: true, takenFrom: "Alice" },
    ],
    lostRecordsSeen: { alice: "2026-10-10T20:00:00" },
};

test("with the High Scores Add-on off, no Lost Records line and no seen marker", async () => {
    const { arrive, isOpen, line, saved } = await startLostRecords({
        addOns: [], profiles: { Alice: {}, Bob: {} }, active: "Bob", files: { [HIGH_SCORES_FILE]: JSON.stringify(HIGH_SCORES) },
    });

    await arrive("Alice");
    assert.equal(isOpen(), true);
    assert.equal(line(), null);
    assert.deepEqual(saved(), HIGH_SCORES, "high_scores.json untouched");
});
