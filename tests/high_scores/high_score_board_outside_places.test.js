// ============================================================
// The High Score Board's read on a known board, through main.js on the
// fake PinballY globals: the screen opens at once on the last known board
// under a "Reading…" note; the read forgets PinballY's cached board, and
// places set outside the pack come in as Default Scores, nothing credited.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, board, FACTORY, MEDIEVAL, avatarFiles } from "./high_scores_scenario.js";
import { openBoard, message, note, podium } from "./high_score_board_reader.js";

test("a known board opens at once under Reading…, then shows the places set outside the pack as Default Scores", async () => {
    const { fake, setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", files: avatarFiles("Alice") });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    // Played outside the pack: PinballY still caches the board it read.
    setBoard(MEDIEVAL, board(["ALI", "60000000"], ["XYZ", "55000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]), { durationMs: 3000 });

    openBoard(fake, lang);
    assert.equal(note(fake), "Reading\u2026");
    assert.equal(message(fake), null);
    assert.deepEqual([podium(fake, lang).left.initials, podium(fake, lang).middle.name], ["SLL", "Alice"]);

    fake.advanceTime(3000);
    await settle();
    assert.equal(note(fake), null);
    const { left, middle } = podium(fake, lang);
    assert.deepEqual([middle.name, left.name, left.initials], ["Alice", "Default score", "XYZ"]);
    assert.deepEqual(saved().highScores.map(({ profile, score }) => [profile, score]), [["Alice", 60000000]]);
    assert.equal(log().filter(line => !line.includes("opened")).at(-1), `[HighScores] "${MEDIEVAL}": board changed outside a Play, 1 new place as Default Scores.`);
});
