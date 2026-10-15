// ============================================================
// High Score Toasts, through main.js on the fake PinballY globals: a
// Table Record taken from another Profile, Guest included, says whom it
// was taken from; never after the Profile's own record, a Default Score,
// or a place below the first.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, MEDIEVAL } from "./high_scores_scenario.js";

test("the Table Record toast names the Profile it was taken from, Guest included", async () => {
    const { setBoard, play, switchTo, toasts } = await startHighScores({ profiles: { Alice: {}, Bob: {} }, active: "Bob" });
    setBoard(MEDIEVAL, board(["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]));

    await play(MEDIEVAL, { after: board(["BOB", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await play(MEDIEVAL, { after: board(["BOB", "65000000"], ["BOB", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    switchTo("Alice");
    await play(MEDIEVAL, { after: board(["BOB", "65000000"], ["AAA", "62000000"], ["BOB", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"]) });
    await play(MEDIEVAL, { after: board(["AAA", "70000000"], ["BOB", "65000000"], ["AAA", "62000000"], ["BOB", "60000000"], ["SLL", "52000000"]) });
    switchTo("guest");
    await play(MEDIEVAL, { after: board(["GST", "80000000"], ["AAA", "70000000"], ["BOB", "65000000"], ["AAA", "62000000"], ["BOB", "60000000"]) });
    switchTo("Bob");
    await play(MEDIEVAL, { after: board(["BOB", "90000000"], ["GST", "80000000"], ["AAA", "70000000"], ["BOB", "65000000"], ["AAA", "62000000"]) });

    assert.deepEqual(toasts(), [
        "1 | HIGH SCORE | Table Record on Medieval Madness! | 60,000,000 points",
        "1 | HIGH SCORE | Table Record on Medieval Madness! | 65,000,000 points",
        "2 | HIGH SCORE | High score on Medieval Madness: 2nd place | 62,000,000 points",
        "1 | HIGH SCORE | Table Record on Medieval Madness! | 70,000,000 points | taken from Bob",
        "1 | HIGH SCORE | Table Record on Medieval Madness! | 80,000,000 points | taken from Alice",
        "1 | HIGH SCORE | Table Record on Medieval Madness! | 90,000,000 points | taken from Guest",
    ]);
});
