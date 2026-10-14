// ============================================================
// The High Score Board in French, through main.js on the fake PinballY
// globals: its entry, "Score par défaut", the scores' thousands separated
// by a no-break space, and "Pas encore de score" on a table never read.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, FACTORY, MEDIEVAL, AFM } from "./high_scores_scenario.js";
import { openBoard, press, podium, message, BOARD_OPEN_MS } from "./high_score_board_reader.js";

test("the board speaks French", async () => {
    const { fake, setBoard, play } = await startHighScores({ language: "fr" });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: FACTORY });

    assert.equal(lang.highScores.board.menuEntry, "Meilleurs scores");
    openBoard(fake, lang);
    const { middle } = podium(fake, lang);
    assert.deepEqual([middle.name, middle.score], ["Score par défaut", "52 000 000"]);
    press(fake, "Exit");
    fake.advanceTime(BOARD_OPEN_MS);

    fake.setWheelGame(1);
    assert.equal(fake.getCurrentTable().configId, AFM);
    openBoard(fake, lang);
    assert.equal(message(fake), "Pas encore de score");
});
