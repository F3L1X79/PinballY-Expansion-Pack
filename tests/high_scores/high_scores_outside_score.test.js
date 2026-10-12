// ============================================================
// A score set outside the pack between two Plays (another front end, a
// Play with the Add-on off), through main.js on the fake PinballY
// globals: the launch read sees it, so it becomes a Default Score and
// only the Play's own new place is credited.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

test("a score set outside the pack between two Plays is not credited", async () => {
    const { setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["LFS", "30000000"]]));
    await play(MEDIEVAL);

    setBoard(MEDIEVAL, boardLines(["SLL", "52000000"], [["XXX", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"]]));
    await play(MEDIEVAL, { after: boardLines(["SLL", "52000000"], [["XXX", "45000000"], ["BRE", "40000000"], ["ALI", "35000000"]]) });

    assert.deepEqual(saved().tables[MEDIEVAL].board.map(({ initials, owner }) => [initials, owner]), [
        ["SLL", null], ["XXX", null], ["BRE", null], ["ALI", "Alice"],
    ]);
    assert.deepEqual(saved().highScores.map(({ initials, place }) => [initials, place]), [["ALI", 4]]);
    assert.deepEqual(log(), [
        `[HighScores] "${MEDIEVAL}": first board read, 3 places, all Default Scores.`,
        `[HighScores] "${MEDIEVAL}": Play by Alice, no new place.`,
        `[HighScores] "${MEDIEVAL}": board changed outside a Play, 1 new place as Default Scores.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 4, 35000000 (ALI).`,
    ]);
});
