// ============================================================
// The High Score Board's Exit Button opened from the main menu, through
// main.js on the fake PinballY globals: the back arrow, its tooltip saying
// Back, the Selection Marker around it; the footer names only Exit (Back)
// on a board that fits; Select, then Launch, reopen the main menu on the
// board's entry, as Exit does.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, MEDIEVAL, FACTORY } from "./high_scores_scenario.js";
import { openBoard, press, isBoardOpen, boardLayerCount, buttonHints, exitButtonTooltip, isMarkerOnExitButton, markerLayerCount } from "./high_score_board_reader.js";
import { expectedButtonHints } from "../support/button_hints_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("from the main menu: the back arrow's Back, and Select or Launch back to the main menu on the entry", async () => {
    const { fake, setBoard } = await startHighScores();
    const { default: lang } = await import("../../common/core/i18n.js");
    fake.setNativeCommand(globalThis.command.ShowMainMenu, () => fake.openMainMenu());
    setBoard(MEDIEVAL, FACTORY, { durationMs: 100 });
    const selectedEntry = () => fake.currentMenu().items.filter(item => item.selected).map(item => item.title);

    for (const button of ["Select", "Launch"]) {
        openBoard(fake, lang);
        await settle();
        assert.equal(exitButtonTooltip(fake), lang.buttonHints.back);
        assert.ok(isMarkerOnExitButton(fake), "the Selection Marker surrounds the Exit Button");
        assert.deepEqual(buttonHints(fake), expectedButtonHints(lang, { flippers: null, select: false, exit: "back" }));

        assert.ok(press(fake, button).defaultPrevented, `${button} never reaches the wheel`);
        assert.ok(!isBoardOpen(fake), `${button} leaves the board`);
        assert.equal(boardLayerCount(fake), 0);
        assert.equal(markerLayerCount(fake), 0);
        assert.deepEqual(selectedEntry(), ["High Scores"]);
        fake.closeMenu();
    }
    assertNoErrorLogged(fake);
});
