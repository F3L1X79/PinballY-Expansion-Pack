// ============================================================
// The High Score Board's read outliving the screen, through main.js on the
// fake PinballY globals: a read ending after Exit only updates the High
// Score store and draws nothing; opening the board again while the read
// runs reuses it, so PINemHi runs once.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, FACTORY, MEDIEVAL } from "./high_scores_scenario.js";
import { openBoard, press, boardLayerCount, message, podium, BOARD_OPEN_MS } from "./high_score_board_reader.js";

test("a read ending after Exit only updates the store; a second opening reuses the read", async () => {
    const { fake, setBoard, saved, log } = await startHighScores();
    const { default: lang } = await import("../../common/core/i18n.js");
    fake.setNativeCommand(globalThis.command.ShowMainMenu, () => fake.openMainMenu());
    let pinemhiRuns = 0;
    fake.on("highscoresrequest", () => { pinemhiRuns++; });
    setBoard(MEDIEVAL, FACTORY, { durationMs: 5000 });

    openBoard(fake, lang);
    press(fake, "Exit");
    fake.advanceTime(BOARD_OPEN_MS);
    fake.closeMenu();
    openBoard(fake, lang);
    assert.equal(message(fake), "Reading\u2026");
    press(fake, "Exit");
    fake.advanceTime(5000);
    await settle();

    assert.equal(boardLayerCount(fake), 0);
    assert.equal(pinemhiRuns, 1);
    assert.equal(saved().tables[MEDIEVAL].board.length, 5);
    assert.deepEqual(log().filter(line => !line.includes("opened") && !line.includes("Default Score image")), [`[HighScores] "${MEDIEVAL}": first board read, 5 places, all Default Scores.`]);

    fake.closeMenu();
    setBoard(MEDIEVAL, FACTORY, { durationMs: 5000 });
    openBoard(fake, lang);
    assert.equal(podium(fake, lang).middle.initials, "SLL");
    assert.equal(pinemhiRuns, 2);
});
