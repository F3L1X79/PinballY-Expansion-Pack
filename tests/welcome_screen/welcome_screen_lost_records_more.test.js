// ============================================================
// Many Lost Records on the Welcome Screen, through main.js on the fake
// PinballY globals: once Bob took five of Alice's Table Records, her line
// names the three most recent and counts the two others; once he took
// four more after she saw them, it counts the one left over.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords, recordBoard } from "./lost_records_scenario.js";
import { avatarFiles, romTables, FACTORY } from "../high_scores/high_scores_scenario.js";

const TABLES = romTables(5);
const CONFIG_IDS = TABLES.map(table => table.configId);

test("past three Lost Records, the line counts the others", async () => {
    const { fake, setBoard, play, playAs, arrive, close, line } = await startLostRecords({
        profiles: { Alice: {}, Bob: {} }, active: "Alice", tables: TABLES, files: avatarFiles("Bob"),
    });
    for (const configId of CONFIG_IDS) {
        setBoard(configId, FACTORY);
        await play(configId, { after: recordBoard("ALI", 60) });
    }
    for (const configId of CONFIG_IDS) await playAs("Bob", configId, recordBoard("BOB", 70));
    await arrive("Alice");
    assert.equal(line(), "Records lost: Table 5 (Bob), Table 4 (Bob), Table 3 (Bob) and 2 more");
    await close();

    for (const configId of CONFIG_IDS.slice(0, 4)) await playAs("Alice", configId, recordBoard("ALI", 80));
    for (const configId of CONFIG_IDS.slice(0, 4)) await playAs("Bob", configId, recordBoard("BOB", 90));
    await arrive("Alice");
    assert.equal(line(), "Records lost: Table 4 (Bob), Table 3 (Bob), Table 2 (Bob) and 1 more");
    assert.deepEqual(fake.logLines().filter(text => text.includes("ERROR")), []);
});
