// ============================================================
// My High Scores on the wheel around a Play, through main.js on the fake
// PinballY globals: a return to the wheel with nothing changed leaves the
// wheel on its table; a better place won from the selection reorders it,
// and a place won on a table outside it (as one launched by Table of the
// Day or Random Game) adds it, once the Play is settled after the game.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, SECOND_PLACE, MEDIEVAL, AFM, TABLES } from "./high_scores_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const THEATRE = "Theatre of Magic (Bally 1995)";
const THEATRE_TABLE = { id: 3, configId: THEATRE, title: "Theatre of Magic", manufacturer: "Bally", year: 1995, isHidden: false, rom: "tom_14h" };
const FILTER_ID = "User.project.MyHighScores";

// Alice's place under the first ones, and the same board with her new Table Record on top.
const FOURTH_PLACE = board(["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ALI", "25000000"], ["ZAP", "20000000"]);
const TABLE_RECORD = board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ALI", "25000000"]);
const THEATRE_RECORD = board(["ALI", "70000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]);

const wheelTitles = fake => fake.getWheelTables().map(game => game.title);

test("the selection follows the places won, and stays put when nothing changed", async () => {
    const { fake, setBoard, play } = await startHighScores({
        profiles: { Alice: {} }, active: "Alice", tables: [...TABLES, THEATRE_TABLE],
    });
    for (const configId of [MEDIEVAL, AFM, THEATRE]) setBoard(configId, FACTORY);
    await play(AFM, { after: SECOND_PLACE });
    await play(MEDIEVAL, { after: FOURTH_PLACE });

    fake.selectFilter(FILTER_ID);
    fake.fire("wheelmode");
    assert.deepEqual(wheelTitles(fake), ["Attack from Mars", "Medieval Madness"]);

    fake.setWheelGame(1);
    fake.openMainMenu();
    fake.closeMenu();
    assert.deepEqual(wheelTitles(fake), ["Medieval Madness", "Attack from Mars"], "still on Medieval Madness");

    await play(MEDIEVAL, { after: TABLE_RECORD });
    assert.deepEqual(wheelTitles(fake), ["Medieval Madness", "Attack from Mars"], "her Table Record first");

    await play(THEATRE, { after: THEATRE_RECORD });
    assert.deepEqual(wheelTitles(fake), ["Medieval Madness", "Theatre of Magic", "Attack from Mars"]);

    assertNoErrorLogged(fake);
});
