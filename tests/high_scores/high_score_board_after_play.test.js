// ============================================================
// The High Score Board opened right after a Play, through main.js on the
// fake PinballY globals: its read waits for the Add-on's read after the
// game, so the Play's new place is still credited to its Profile and the
// board shows it as theirs.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, FACTORY, SECOND_PLACE, MEDIEVAL, avatarFiles } from "./high_scores_scenario.js";
import { openBoard, isBoardOpen, note, podium } from "./high_score_board_reader.js";

test("opening the board right after a game never takes the Play's place from its Profile", async () => {
    const { fake, setBoard, play, saved, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", files: avatarFiles("Alice") });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL);

    await play(MEDIEVAL, { after: SECOND_PLACE, backOnWheel: () => openBoard(fake, lang) });

    assert.deepEqual(saved().highScores.map(({ profile, place }) => [profile, place]), [["Alice", 2]]);
    assert.equal(toasts().length, 1);
    assert.ok(isBoardOpen(fake));
    assert.equal(note(fake), null);
    assert.deepEqual([podium(fake, lang).left.name, podium(fake, lang).left.initials], ["Alice", "ALI"]);
});
