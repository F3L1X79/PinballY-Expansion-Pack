// ============================================================
// The High Score Board, through main.js on the fake PinballY globals: a
// table never read shows "No score yet"; while open the board swallows
// every button; Exit removes every layer and reopens the main menu on its
// entry; attract mode closes it too, leaving the player on the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores } from "./high_scores_scenario.js";
import { openBoard, press, isBoardOpen, boardLayerCount, title, message, podium, rows, BOARD_OPEN_MS } from "./high_score_board_reader.js";

test("a never-read table says so; Exit goes back to the main menu on the entry, attract mode to the wheel", async () => {
    const { fake } = await startHighScores();
    const { default: lang } = await import("../../common/core/i18n.js");
    fake.setNativeCommand(globalThis.command.ShowMainMenu, () => fake.openMainMenu());

    openBoard(fake, lang);
    assert.equal(title(fake), "Medieval Madness");
    assert.equal(message(fake), "No score yet");
    assert.deepEqual(podium(fake, lang), { left: null, middle: null, right: null });
    assert.deepEqual(rows(fake, lang), []);
    for (const button of ["Next", "Prev", "Select", "Launch", "Info"]) {
        assert.ok(press(fake, button).defaultPrevented, `${button} never reaches the wheel`);
    }
    assert.ok(isBoardOpen(fake));

    assert.ok(press(fake, "Exit").defaultPrevented);
    assert.equal(boardLayerCount(fake), 0);
    assert.deepEqual(fake.currentMenu().items.filter(item => item.selected).map(item => item.title), ["High Scores"]);
    fake.closeMenu();

    openBoard(fake, lang);
    fake.enterAttractMode();
    assert.equal(boardLayerCount(fake), 0);
    assert.equal(fake.currentMenu(), null);
    assert.ok(!press(fake, "Next").defaultPrevented, "the buttons are the wheel's again");
    fake.advanceTime(BOARD_OPEN_MS);
});
