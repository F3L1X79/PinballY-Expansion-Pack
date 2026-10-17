// ============================================================
// The High Score Board's Exit Button opened by the dedicated HighScores
// button, through main.js on the fake PinballY globals: the cross, its
// tooltip saying Close, the Selection Marker around it; the footer names
// only Exit (Close); Select, then Launch, leave the bare wheel, as Exit does.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, MEDIEVAL, FACTORY } from "./high_scores_scenario.js";
import { press, isBoardOpen, boardLayerCount, buttonHints, exitButtonTooltip, isMarkerOnExitButton, markerLayerCount, BOARD_OPEN_MS } from "./high_score_board_reader.js";
import { expectedButtonHints } from "../support/button_hints_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("from the HighScores button: the cross's Close, and Select or Launch back to the bare wheel", async () => {
    const { fake, setBoard } = await startHighScores();
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY, { durationMs: 100 });

    for (const button of ["Select", "Launch"]) {
        fake.runCommand(globalThis.command.HighScores);
        fake.advanceTime(BOARD_OPEN_MS);
        await settle();
        assert.equal(exitButtonTooltip(fake), lang.buttonHints.close);
        assert.ok(isMarkerOnExitButton(fake), "the Selection Marker surrounds the Exit Button");
        assert.deepEqual(buttonHints(fake), expectedButtonHints(lang, { flippers: null, select: false, exit: "close" }));

        assert.ok(press(fake, button).defaultPrevented, `${button} never reaches the wheel`);
        assert.ok(!isBoardOpen(fake), `${button} leaves the board`);
        assert.equal(boardLayerCount(fake), 0);
        assert.equal(markerLayerCount(fake), 0);
        assert.equal(fake.currentMenu(), null);
        assert.ok(!fake.executedCommands().includes(globalThis.command.ShowMainMenu), "straight back to the wheel");
        assert.ok(!press(fake, "Next").defaultPrevented, "the buttons are the wheel's again");
    }
    assertNoErrorLogged(fake);
});
