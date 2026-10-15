// ============================================================
// The High Score Board's read on a table never read, through main.js on
// the fake PinballY globals: the screen opens at once on "Reading…" and
// redraws in place when PINemHi ends; the board read is the table's
// baseline, all Default Scores.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, FACTORY, MEDIEVAL } from "./high_scores_scenario.js";
import { openBoard, isBoardOpen, message, note, podium, rows } from "./high_score_board_reader.js";

const step = (rank, initials, score, isTableRecord = false) => ({ rank: String(rank), name: "Default score", avatar: null, initials, score, isTableRecord });

test("a never-read table shows Reading… then its board, saved as the baseline, all Default Scores", async () => {
    const { fake, setBoard, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY, { durationMs: 3000 });

    openBoard(fake, lang);
    assert.ok(isBoardOpen(fake));
    assert.equal(message(fake), "Reading\u2026");
    assert.deepEqual(podium(fake, lang), { left: null, middle: null, right: null });

    fake.advanceTime(3000);
    await settle();
    assert.equal(message(fake), null);
    assert.equal(note(fake), null);
    assert.deepEqual(podium(fake, lang), {
        left: step(2, "BRE", "40,000,000"),
        middle: step(1, "SLL", "52,000,000", true),
        right: step(3, "LFS", "30,000,000"),
    });
    assert.deepEqual(rows(fake, lang).map(row => row.initials), ["ZAP", "RCF"]);
    assert.deepEqual(saved().tables[MEDIEVAL].board.map(place => place.owner), [null, null, null, null, null]);
    assert.deepEqual(saved().highScores, []);
    assert.deepEqual(log().filter(line => !line.includes("opened") && !line.includes("Default Score image")), [`[HighScores] "${MEDIEVAL}": first board read, 5 places, all Default Scores.`]);
});
