// ============================================================
// Several Lost Records on the Welcome Screen, through main.js on the fake
// PinballY globals: Bob and Claire took three of Alice's Table Records,
// one of them again after she took it back; her next Welcome Screen sums
// them up in one line, the most recent first, with each taker, behind the
// most recent taker's Avatar.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords, recordBoard } from "./lost_records_scenario.js";
import { avatarFiles, avatarOf, romTables, FACTORY } from "../high_scores/high_scores_scenario.js";

const TABLES = romTables(3);
const [ONE, TWO, THREE] = TABLES.map(table => table.configId);

test("Alice's Welcome Screen names each table she lost once, the most recent first, with its taker", async () => {
    const { setBoard, play, playAs, arrive, line, lineImages } = await startLostRecords({
        profiles: { Alice: {}, Bob: {}, Claire: {} }, active: "Alice", tables: TABLES, files: avatarFiles("Bob", "Claire"),
    });
    for (const configId of [ONE, TWO, THREE]) {
        setBoard(configId, FACTORY);
        await play(configId, { after: recordBoard("ALI", 60) });
    }

    await playAs("Bob", ONE, recordBoard("BOB", 70));
    await playAs("Alice", ONE, recordBoard("ALI", 80));
    await playAs("Claire", TWO, recordBoard("CLA", 70));
    await playAs("Bob", THREE, recordBoard("BOB", 70));
    await playAs("Claire", ONE, recordBoard("CLA", 90));
    await arrive("Alice");

    assert.equal(line(), "Records lost: Table 1 (Claire), Table 3 (Bob) and Table 2 (Claire)");
    assert.deepEqual(lineImages(), [avatarOf("Claire")], "the most recent taker's Avatar");
});
