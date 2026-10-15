// ============================================================
// Lost Records on tables out of sight, through main.js on the fake
// PinballY globals: Bob took four Table Records from Alice, a Child
// Profile; since then one table was hidden, one removed from the
// collection and one became an Adult Table, so Alice is only told of the
// fourth.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords, recordBoard } from "./lost_records_scenario.js";
import { MEDIEVAL, AFM, FACTORY, TABLES } from "../high_scores/high_scores_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TWILIGHT_ZONE = "Twilight Zone (Bally 1993)";
const THEATRE = "Theatre of Magic (Bally 1995)";
const ALL_TABLES = [
    ...TABLES,
    { id: 3, configId: TWILIGHT_ZONE, title: "Twilight Zone", manufacturer: "Bally", year: 1993, isHidden: false, rom: "tz_92" },
    { id: 4, configId: THEATRE, title: "Theatre of Magic", manufacturer: "Bally", year: 1995, isHidden: false, rom: "tom_14h" },
];

test("Lost Records on hidden, removed or Adult Tables are left out for a Child Profile", async () => {
    const { fake, setBoard, play, playAs, arrive, line } = await startLostRecords({
        profiles: { Alice: { isChild: true }, Bob: {} }, active: "Alice", tables: ALL_TABLES,
    });
    for (const game of ALL_TABLES) setBoard(game.configId, FACTORY);
    for (const game of ALL_TABLES) await play(game.configId, { after: recordBoard("ALI", 60) });
    for (const game of ALL_TABLES) await playAs("Bob", game.configId, recordBoard("BOB", 70));

    fake.setTables(ALL_TABLES
        .filter(game => game.configId !== AFM)
        .map(game => (game.configId === MEDIEVAL ? { ...game, isHidden: true } : game))
        .map(game => (game.configId === TWILIGHT_ZONE ? { ...game, categories: ["NSFW"] } : game)));

    await arrive("Alice");
    assert.equal(line(), "Bob took your record on Theatre of Magic");
    assertNoErrorLogged(fake);
});
