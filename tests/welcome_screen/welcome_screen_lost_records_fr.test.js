// ============================================================
// Several Lost Records on the Welcome Screen in French, through main.js
// on the fake PinballY globals: two tables named, then three named and one
// "autre", then three named and two "autres".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords, recordBoard } from "./lost_records_scenario.js";
import { avatarFiles, romTables, FACTORY } from "../high_scores/high_scores_scenario.js";

const TABLES = romTables(5);
const CONFIG_IDS = TABLES.map(table => table.configId);

test("in French, the line joins the tables with \"et\" and counts the others in the singular or plural", async () => {
    const { setBoard, playAs, arrive, close, line } = await startLostRecords({
        profiles: { Alice: {}, Bob: {}, Claire: {} }, active: "Alice", tables: TABLES, files: avatarFiles("Bob", "Claire"), language: "fr",
    });
    for (const configId of CONFIG_IDS) setBoard(configId, FACTORY);

    // Each round, Alice holds every Table Record, then the takers take theirs.
    async function round(score, takings) {
        for (const configId of CONFIG_IDS) await playAs("Alice", configId, recordBoard("ALI", score));
        for (const [name, configId] of takings) await playAs(name, configId, recordBoard(name.slice(0, 3).toUpperCase(), score + 1));
        await arrive("Alice");
        const shown = line();
        await close();
        return shown;
    }

    assert.equal(await round(60, [["Bob", CONFIG_IDS[0]], ["Claire", CONFIG_IDS[1]]]),
        "Records perdus : Table 2 (Claire) et Table 1 (Bob)");
    assert.equal(await round(70, CONFIG_IDS.slice(0, 4).map(configId => ["Bob", configId])),
        "Records perdus : Table 4 (Bob), Table 3 (Bob), Table 2 (Bob) et 1 autre");
    assert.equal(await round(80, CONFIG_IDS.map(configId => ["Claire", configId])),
        "Records perdus : Table 5 (Claire), Table 4 (Claire), Table 3 (Claire) et 2 autres");
});
