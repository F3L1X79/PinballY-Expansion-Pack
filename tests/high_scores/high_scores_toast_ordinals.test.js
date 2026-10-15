// ============================================================
// High Score Toasts' ordinals in English, through main.js on the fake
// PinballY globals: 2nd, 3rd, 4th, then 11th to 13th and 21st to 23rd on
// a long board.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, MEDIEVAL } from "./high_scores_scenario.js";

// 25 places, 25,000,000 down to 1,000,000 points.
const LONG_BOARD = Array.from({ length: 25 }, (_, index) => [`P${index + 1}`, String((25 - index) * 1000000)]);
// The long board with a new score just above the given place, the last place pushed off.
const withNewPlace = (places, rank) => {
    const score = Number(places[rank - 1][1]) + 500000;
    return [...places.slice(0, rank - 1), [`N${rank}`, String(score)], ...places.slice(rank - 1, -1)];
};

test("the toasts' English ordinals: 2nd, 3rd, 4th, 11th, 12th, 13th, 21st, 22nd, 23rd", async () => {
    const { setBoard, play, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    let places = LONG_BOARD;
    setBoard(MEDIEVAL, board(...places));

    for (const rank of [2, 3, 4, 11, 12, 13, 21, 22, 23]) {
        places = withNewPlace(places, rank);
        await play(MEDIEVAL, { after: board(...places) });
    }

    assert.deepEqual(toasts().map(toast => toast.split(" | ")[2].split(": ")[1]), [
        "2nd place", "3rd place", "4th place", "11th place", "12th place", "13th place", "21st place", "22nd place", "23rd place",
    ]);
});
