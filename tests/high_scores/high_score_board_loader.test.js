// ============================================================
// The High Score Board's Loader, through main.js on the fake PinballY
// globals: the comet turns on the top third, above the board, while the
// opened table's board is read fresh, and goes as soon as the board is
// redrawn with the read's outcome (fresh board, no score, failed, not
// supported, not learned) or closed by Exit or attract mode; a read ending
// after close does not bring it back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import {
    startHighScores, TABLES, FACTORY, EMPTY_BOARD, NOT_SUPPORTED, MEDIEVAL, ZELDA_TABLE, ZELDA_FACTORY, OTHER_SECTIONS,
} from "./high_scores_scenario.js";
import { openBoard, press, isBoardOpen, message, BOARD_OPEN_MS } from "./high_score_board_reader.js";

// Above the board's glass (6188), under the Drawn Menus (6200 up).
const SHOWN = { shown: true, zIndex: 6189, scale: { ySpan: 0.07 }, position: { x: 0, y: 1 / 6 } };
const GONE = { shown: false };

test("the comet turns while the board is read fresh and goes with every outcome or close", async () => {
    const { fake, setBoard, setVpreg } = await startHighScores({ tables: [...TABLES, ZELDA_TABLE] });
    const { default: lang } = await import("../../common/core/i18n.js");
    fake.setNativeCommand(globalThis.command.ShowMainMenu, () => fake.openMainMenu());
    assert.equal(loaderLayerCount(fake), 0, "no Loader before the board opens");

    // Opens the board on a read lasting ms, checks the comet turns while
    // it is pending, ends it and returns what the board then says.
    const readFor = async (ms) => {
        openBoard(fake, lang);
        assert.deepEqual(readLoader(fake), SHOWN, "turning above the board while the read is pending");
        fake.advanceTime(ms);
        await settle();
        const outcome = { loader: readLoader(fake), layers: loaderLayerCount(fake), message: message(fake) };
        press(fake, "Exit");
        fake.advanceTime(BOARD_OPEN_MS);
        fake.closeMenu();
        return outcome;
    };
    const redrawnWith = text => ({ loader: GONE, layers: 0, message: text });

    setBoard(MEDIEVAL, FACTORY, { fails: true });
    assert.deepEqual(await readFor(1000), redrawnWith("This table's high scores are not supported"), "a failed first read");
    setBoard(MEDIEVAL, FACTORY, { durationMs: 3000 });
    assert.deepEqual(await readFor(3000), redrawnWith(null), "a fresh board");
    setBoard(MEDIEVAL, FACTORY, { fails: true });
    assert.deepEqual(await readFor(1000), redrawnWith(null), "a known board that could not be refreshed");
    setBoard(MEDIEVAL, NOT_SUPPORTED);
    assert.deepEqual(await readFor(1000), redrawnWith("This table's high scores are not supported"), "not supported");
    setBoard(MEDIEVAL, EMPTY_BOARD);
    assert.deepEqual(await readFor(1000), redrawnWith("No score yet"), "no score");

    setVpreg({ ...OTHER_SECTIONS, ZELDA: ZELDA_FACTORY });
    fake.setWheelGame(TABLES.length);
    assert.deepEqual(await readFor(1000), redrawnWith("Play a game to bring up this table's high scores"), "not learned");
    fake.setWheelGame(-TABLES.length);

    setBoard(MEDIEVAL, FACTORY, { durationMs: 5000 });
    openBoard(fake, lang);
    assert.deepEqual(readLoader(fake), SHOWN);
    press(fake, "Exit");
    assert.equal(loaderLayerCount(fake), 0, "gone with the board on Exit");
    fake.advanceTime(5000);
    await settle();
    assert.equal(loaderLayerCount(fake), 0, "a read ending after Exit does not bring it back");
    fake.advanceTime(BOARD_OPEN_MS);
    fake.closeMenu();

    setBoard(MEDIEVAL, FACTORY, { durationMs: 5000 });
    openBoard(fake, lang);
    assert.deepEqual(readLoader(fake), SHOWN);
    fake.enterAttractMode();
    assert.ok(!isBoardOpen(fake));
    assert.equal(loaderLayerCount(fake), 0, "gone with the board in attract mode");
    fake.advanceTime(5000);
    await settle();
    assert.equal(loaderLayerCount(fake), 0, "a read ending after attract mode does not bring it back");
    assertNoErrorLogged(fake);
});
