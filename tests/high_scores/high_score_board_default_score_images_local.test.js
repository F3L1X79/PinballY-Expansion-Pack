// ============================================================
// The High Score Board, through main.js on the fake PinballY globals: the
// Default Scores show every numbered image of the pack, past the tenth,
// and the owner's own ones in the local\ folder; any other file of these
// folders (a source sheet) is left out.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, FACTORY, MEDIEVAL, DEFAULT_SCORE_IMAGES_PATH, defaultScoreImageOf, defaultScoreImageFiles, localDefaultScoreImageOf } from "./high_scores_scenario.js";
import { openBoard, podium, rows } from "./high_score_board_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("numbered images past the tenth and the local ones show, other files don't", async () => {
    const { fake, setBoard } = await startHighScores({
        files: {
            ...defaultScoreImageFiles(12, 28),
            [localDefaultScoreImageOf(1)]: "png",
            [`${DEFAULT_SCORE_IMAGES_PATH}\\local\\sheet.png`]: "png",
            [`${DEFAULT_SCORE_IMAGES_PATH}\\sheet.png`]: "png",
        },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);

    fake.setLayoutSize({ width: 1080, height: 1920 });
    openBoard(fake, lang);
    fake.advanceTime(1000);
    await settle();
    const { left, middle, right } = podium(fake, lang);
    const images = [middle, left, right, ...rows(fake, lang)].map(place => place.avatar);
    assert.deepEqual([...new Set(images)].sort(), [defaultScoreImageOf(12), defaultScoreImageOf(28), localDefaultScoreImageOf(1)].sort());
    assertNoErrorLogged(fake);
});
