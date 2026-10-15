// ============================================================
// The read at launch going wrong, through main.js on the fake PinballY
// globals: whether PINemHi fails, is killed by PinballY or never answers,
// the Play is compared with the table's last known board and its new
// place is still credited; the Add-on's own timeout leaves no timer behind.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

const FIRST = boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]]);
const SECOND = boardLines(["SLL", "52000000"], [["ALI", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"]]);
const THIRD = boardLines(["SLL", "52000000"], [["ALI", "45000000"], ["ALI", "42000000"], ["BRE", "40000000"]]);
const FOURTH = boardLines(["ALI", "60000000"], [["SLL", "52000000"], ["ALI", "45000000"], ["ALI", "42000000"]]);

test("a failed, killed or unanswered launch read falls back to the last known board", async () => {
    const { setBoard, play, saved, log, pendingTimerCount } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, FIRST);
    await play(MEDIEVAL);

    setBoard(MEDIEVAL, FIRST, { fails: true });
    await play(MEDIEVAL, { after: SECOND });
    setBoard(MEDIEVAL, SECOND, { durationMs: 9000 });
    await play(MEDIEVAL, { after: THIRD });
    setBoard(MEDIEVAL, THIRD, { hangs: true });
    const timersBefore = pendingTimerCount();
    await play(MEDIEVAL, { after: FOURTH });

    assert.equal(pendingTimerCount(), timersBefore);
    assert.deepEqual(saved().highScores.map(({ profile, place, score, tableRecord }) => [profile, place, score, tableRecord]), [
        ["Alice", 2, 45000000, false],
        ["Alice", 3, 42000000, false],
        ["Alice", 1, 60000000, true],
    ]);
    assert.deepEqual(log(), [
        `[HighScores] "${MEDIEVAL}": first board read, 4 places, all Default Scores.`,
        `[HighScores] "${MEDIEVAL}": Play by Alice, no new place.`,
        `[HighScores] "${MEDIEVAL}": the high scores read failed (PINemHi could not read the high scores.).`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 2, 45000000 (ALI).`,
        `[HighScores] "${MEDIEVAL}": the high scores read failed (PINemHi could not read the high scores.).`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 3, 42000000 (ALI).`,
        `[HighScores] "${MEDIEVAL}": the high scores read timed out.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 1, 60000000 (ALI), Table Record.`,
    ]);
});
