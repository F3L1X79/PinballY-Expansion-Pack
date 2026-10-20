// ============================================================
// Beat the Grown-Ups once Notified, through main.js on the fake PinballY
// globals: the former holder marked as a child afterwards does not take it
// back, so the child's Achievement List still shows it Unlocked.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, romTables, PROFILES_FOLDER } from "../high_scores/high_scores_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const [T1] = romTables(1).map(table => table.configId);
const TITLE = "Beat the Grown-Ups";

test("a grown-up marked as a child later does not take Beat the Grown-Ups back", async () => {
    const { fake, setBoard, play, switchTo, showEveryToast, notified, readShown } = await startHighScores({
        addOns: ["highScores", "achievements", "customMenuCommands"],
        profiles: { Kid: { isChild: true }, Mom: {} },
        active: "Mom",
        tables: romTables(1),
    });
    setBoard(T1, FACTORY);
    await play(T1, { after: board(["MOM", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await showEveryToast();
    await switchTo("Kid");
    await play(T1, { after: board(["KID", "70000000"], ["MOM", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await showEveryToast();
    assert.ok(notified("Kid").includes("grownUpRecordTaken"));

    const momFile = `${PROFILES_FOLDER}\\Mom\\profile.json`;
    fake.addFile(momFile, JSON.stringify({ ...JSON.parse(fake.files.readText(momFile)), isChild: true }));
    await switchTo("Mom");
    await switchTo("Kid");
    assert.deepEqual(readShown([TITLE]).map(row => row.unlocked), [true]);

    assertNoErrorLogged(fake);
});
