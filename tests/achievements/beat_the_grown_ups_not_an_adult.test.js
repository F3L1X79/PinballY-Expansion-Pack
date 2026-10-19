// ============================================================
// Beat the Grown-Ups through main.js on the fake PinballY globals: a Child
// Profile beating a Default Score unlocks neither The Usurper nor Beat the
// Grown-Ups; taking a Table Record from another child or from Guest unlocks
// only The Usurper.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, romTables } from "../high_scores/high_scores_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { getHighScoreStore } from "../../common/high_scores/high_score_store.js";

const [T1, T2, T3] = romTables(3).map(table => table.configId);

test("a Table Record taken from a Default Score, another child or Guest is no grown-up's", async () => {
    const { fake, setBoard, play, switchTo, showEveryToast, notified } = await startHighScores({
        addOns: ["highScores", "achievements", "customMenuCommands"],
        profiles: { Kid: { isChild: true }, Sis: { isChild: true }, guest: {} },
        active: "Kid",
        tables: romTables(3),
    });
    for (const table of [T1, T2, T3]) setBoard(table, FACTORY);
    const takenBy = (initials, score) => board([initials, score], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]);
    const retakenBy = (initials, from) => board([initials, "70000000"], [from, "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]);

    await play(T1, { after: takenBy("KID", "60000000") });
    await showEveryToast();
    assert.ok(!notified("Kid").includes("tableRecordTaken"), "from a Default Score");
    assert.ok(!notified("Kid").includes("grownUpRecordTaken"), "from a Default Score");

    switchTo("Sis");
    await play(T2, { after: takenBy("SIS", "60000000") });
    switchTo("guest");
    await play(T3, { after: takenBy("GST", "60000000") });
    switchTo("Kid");
    await play(T3, { after: retakenBy("KID", "GST") });
    await showEveryToast();
    assert.ok(notified("Kid").includes("tableRecordTaken"), "from Guest");
    assert.ok(!notified("Kid").includes("grownUpRecordTaken"), "from Guest");
    await play(T2, { after: retakenBy("KID", "SIS") });
    await showEveryToast();
    assert.ok(!notified("Kid").includes("grownUpRecordTaken"), "from another child");
    assert.deepEqual(getHighScoreStore().achievementCountsOf("Kid"), {
        highScoreTables: 3, tableRecordTables: 3, tookTableRecord: true, tookGrownUpTableRecord: false,
    }, "the record taken from another child counts too");

    assertNoErrorLogged(fake);
});
