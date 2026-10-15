// ============================================================
// A Profile's first Welcome Screen with the Lost Records, through main.js
// on the fake PinballY globals: Bob took Alice's Table Record before she
// ever saw a Welcome Screen telling Lost Records, so it tells nothing and
// only sets her seen marker; the next taking is told.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords } from "./lost_records_scenario.js";
import { board, MEDIEVAL, HIGH_SCORES_FILE } from "../high_scores/high_scores_scenario.js";

const BOB_RECORD = board(["BOB", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]);
// Bob took Alice's record the day before, the place known since.
const HIGH_SCORES = {
    version: 1,
    tables: {
        [MEDIEVAL]: {
            board: [
                { rank: 1, initials: "BOB", score: "70000000", owner: "Bob" },
                { rank: 2, initials: "ALI", score: "60000000", owner: "Alice" },
                { rank: 3, initials: "SLL", score: "52000000", owner: null },
                { rank: 4, initials: "BRE", score: "40000000", owner: null },
                { rank: 5, initials: "LFS", score: "30000000", owner: null },
            ],
        },
    },
    highScores: [
        { profile: "Alice", configId: MEDIEVAL, score: "60000000", initials: "ALI", place: 1, date: "2026-10-11T20:00:00", tableRecord: true, takenFrom: null },
        { profile: "Bob", configId: MEDIEVAL, score: "70000000", initials: "BOB", place: 1, date: "2026-10-11T21:00:00", tableRecord: true, takenFrom: "Alice" },
    ],
};

test("a Profile's first Welcome Screen tells no Lost Record and only sets its seen marker", async () => {
    const { setBoard, play, arrive, close, line, seenMarkers } = await startLostRecords({
        profiles: { Alice: {}, Bob: {} }, active: "Bob", files: { [HIGH_SCORES_FILE]: JSON.stringify(HIGH_SCORES) },
    });
    setBoard(MEDIEVAL, BOB_RECORD);

    await arrive("Alice");
    assert.equal(line(), null, "taken before the feature");
    assert.match(seenMarkers().alice, /^2026-10-12T20:/, "set when the screen shows");
    await close();

    await play(MEDIEVAL, { after: board(["ALI", "80000000"], ["BOB", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"]) });
    await arrive("Bob");
    assert.equal(line(), "Alice took your record on Medieval Madness", "Bob's marker was set at startup");
});
