// ============================================================
// Table Records, through main.js on the fake PinballY globals: a new
// first place is the Table Record, "taken from" the Profile that held the
// first place before when it still exists (Guest included), never from a
// Default Score. Guest and a Child Profile are credited like any Profile,
// and every new place of a multiplayer game goes to the active Profile.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

// The first entry is the Grand Champion, the others the numbered places.
const board = (...entries) => boardLines(entries[0], entries.slice(1));

test("each new first place is a Table Record, taken from the Profile that held it, Guest included, never from a Default Score", async () => {
    const { setBoard, play, switchTo, saved, log } = await startHighScores({
        profiles: { Alice: {}, Bob: {}, Kid: { isChild: true } }, active: "Bob",
    });
    setBoard(MEDIEVAL, board(["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]));

    await play(MEDIEVAL, { after: board(["BOB", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    switchTo("Alice");
    await play(MEDIEVAL, { after: board(["BOB", "70000000"], ["BOB", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    switchTo("guest");
    await play(MEDIEVAL, { after: board(["GST", "80000000"], ["BOB", "70000000"], ["BOB", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"]) });
    switchTo("Kid");
    await play(MEDIEVAL, { after: board(["KID", "90000000"], ["GST", "80000000"], ["BOB", "70000000"], ["BOB", "60000000"], ["SLL", "52000000"]) });
    // A two-player game on Alice's Profile: both new places are hers.
    switchTo("Alice");
    await play(MEDIEVAL, { after: board(["AAA", "99000000"], ["KID", "90000000"], ["GST", "80000000"], ["BBB", "75000000"], ["BOB", "70000000"]) });

    assert.deepEqual(saved().highScores.map(({ profile, place, score, tableRecord, takenFrom }) => ({ profile, place, score, tableRecord, takenFrom })), [
        { profile: "Bob", place: 1, score: 60000000, tableRecord: true, takenFrom: null },
        { profile: "Alice", place: 1, score: 70000000, tableRecord: true, takenFrom: "Bob" },
        { profile: "guest", place: 1, score: 80000000, tableRecord: true, takenFrom: "Alice" },
        { profile: "Kid", place: 1, score: 90000000, tableRecord: true, takenFrom: "guest" },
        { profile: "Alice", place: 1, score: 99000000, tableRecord: true, takenFrom: "Kid" },
        { profile: "Alice", place: 4, score: 75000000, tableRecord: false, takenFrom: null },
    ]);
    assert.deepEqual(saved().tables[MEDIEVAL].board.map(place => place.owner), ["Alice", "Kid", "guest", "Alice", "Alice"]);
    assert.deepEqual(log().filter(line => line.includes("High Score for")), [
        `[HighScores] "${MEDIEVAL}": High Score for Bob: place 1, 60000000 (BOB), Table Record.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 1, 70000000 (BOB), Table Record taken from Bob.`,
        `[HighScores] "${MEDIEVAL}": High Score for guest: place 1, 80000000 (GST), Table Record taken from Alice.`,
        `[HighScores] "${MEDIEVAL}": High Score for Kid: place 1, 90000000 (KID), Table Record taken from guest.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 1, 99000000 (AAA), Table Record taken from Kid.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 4, 75000000 (BBB).`,
    ]);
});
