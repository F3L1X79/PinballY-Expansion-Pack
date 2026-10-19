// ============================================================
// Beat the Grown-Ups, a Young Players Achievement, through main.js on the
// fake PinballY globals: a Child Profile taking an adult's Table Record gets
// The Usurper and Beat the Grown-Ups, announced in Gold. Not secret: its
// title and description show while it is missing. An adult never sees it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, romTables } from "../high_scores/high_scores_scenario.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const emblemOf = rank => `C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\rank_${rank}_tile.png`;
const [T1] = romTables(1).map(table => table.configId);
const TITLE = "Beat the Grown-Ups";

test("a child taking an adult's Table Record gets The Usurper and Beat the Grown-Ups in Gold", async () => {
    const { fake, setBoard, play, switchTo, showEveryToast, notified, readShown } = await startHighScores({
        addOns: ["highScores", "achievements", "customMenuCommands"],
        profiles: { Kid: { isChild: true }, Mom: {} },
        active: "Mom",
        tables: romTables(1),
        files: Object.fromEntries(["bronze", "silver", "gold", "platinum"].map(rank => [emblemOf(rank), "PNG"])),
    });
    setBoard(T1, FACTORY);
    await play(T1, { after: board(["MOM", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await showEveryToast();
    assert.deepEqual(readShown([TITLE]), [undefined], "an adult never sees it");

    switchTo("Kid");
    const [missing] = readShown([TITLE]);
    assert.equal(missing.unlocked, false);
    const before = toastDrawings(fake).length;
    await play(T1, { after: board(["KID", "70000000"], ["MOM", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await showEveryToast();
    assert.ok(notified("Kid").includes("tableRecordTaken"));
    assert.ok(notified("Kid").includes("grownUpRecordTaken"));
    const toast = toastDrawings(fake).slice(before).find(drawing => drawing.texts.includes(TITLE));
    assert.ok(toast.texts.includes("Take a Table Record from a grown-up."));
    assert.deepEqual(toast.images, [emblemOf("gold")], "announced in Gold");
    assert.deepEqual(readShown([TITLE]).map(row => row.unlocked), [true]);

    // Mom takes it back: she still never has it.
    switchTo("Mom");
    await play(T1, { after: board(["MOM", "80000000"], ["KID", "70000000"], ["MOM", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"]) });
    await showEveryToast();
    assert.ok(!notified("Mom").includes("grownUpRecordTaken"));
    assert.deepEqual(readShown([TITLE]), [undefined]);

    assertNoErrorLogged(fake);
});
