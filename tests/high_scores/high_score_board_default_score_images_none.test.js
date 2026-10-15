// ============================================================
// The High Score Board, through main.js on the fake PinballY globals:
// without any Default Score image, the Default Scores show the empty
// square, logged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, FACTORY, MEDIEVAL, DEFAULT_SCORE_IMAGES_PATH } from "./high_scores_scenario.js";
import { openBoard, podium } from "./high_score_board_reader.js";

test("without any Default Score image, the Default Scores show the empty square", async () => {
    const { fake, setBoard, log } = await startHighScores();
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);

    openBoard(fake, lang);
    fake.advanceTime(1000);
    await settle();
    const { left, middle, right } = podium(fake, lang);
    assert.deepEqual([middle, left, right].map(place => [place.name, place.avatar]), [
        [lang.highScores.board.defaultScore, null], [lang.highScores.board.defaultScore, null], [lang.highScores.board.defaultScore, null],
    ]);
    assert.ok(log().includes(`[HighScores] No Default Score image in ${DEFAULT_SCORE_IMAGES_PATH}; Default Scores show without one.`));
});
