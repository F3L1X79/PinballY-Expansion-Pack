// ============================================================
// A Table Record beaten by the Profile that holds it, through main.js on
// the fake PinballY globals: still a Table Record, taken from nobody.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

// The first entry is the Grand Champion, the others the numbered places.
const board = (...entries) => boardLines(entries[0], entries.slice(1));

test("beating one's own Table Record takes it from nobody", async () => {
    const { setBoard, play, saved } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, board(["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]));

    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"]) });
    await play(MEDIEVAL, { after: board(["ALI", "65000000"], ["ALI", "60000000"], ["SLL", "52000000"]) });

    assert.deepEqual(saved().highScores.map(({ tableRecord, takenFrom }) => ({ tableRecord, takenFrom })), [
        { tableRecord: true, takenFrom: null },
        { tableRecord: true, takenFrom: null },
    ]);
});
