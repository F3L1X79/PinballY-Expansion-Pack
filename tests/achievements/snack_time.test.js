// ============================================================
// Snack Time, a secret of the Young Players family, started through main.js
// on the fake PinballY globals: only a Child Profile's Play started from
// 16:00 to 16:59 unlocks it, announced in Bronze; 15:59 and 17:00 do not.
// While missing, its row shows "???" and its hint.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, showsMissing, showsUnlocked } from "./surprises_scenario.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const emblemOf = rank => `C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\rank_${rank}_tile.png`;

test("only a Child Profile's Play started from 16:00 to 16:59 unlocks Snack Time, in Bronze", async () => {
    // Monday 5 October 2026.
    const { fake, TEXT, LIST_TEXT, waitUntil, play, listRows, switchTo } = await startSurprisesScenario({
        now: new Date(2026, 9, 5, 9, 0, 0),
        files: Object.fromEntries(["bronze", "silver", "gold", "platinum"].map(rank => [emblemOf(rank), "PNG"])),
    });
    const secret = { title: TEXT.snackTimeTitle(), description: TEXT.snackTimeDescription(), hint: TEXT.snackTimeHint() };
    assert.equal(secret.title, "Snack Time");
    assert.equal(secret.description, "Start a game between 4 and 5 pm.");

    await switchTo("Bob");
    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));

    waitUntil(2026, 9, 5, 15, 59);
    assert.ok(!(await play()).includes(secret.title), "at 15:59");
    waitUntil(2026, 9, 5, 17, 0);
    assert.ok(!(await play()).includes(secret.title), "at 17:00");
    waitUntil(2026, 9, 6, 16, 30);
    const before = toastDrawings(fake).length;
    assert.ok((await play()).includes(secret.title), "at 16:30");
    const toast = toastDrawings(fake).slice(before).find(drawing => drawing.texts.includes(secret.title));
    assert.deepEqual(toast.images, [emblemOf("bronze")], "announced in Bronze");
    assert.ok(showsUnlocked(listRows(), secret));

    assertNoErrorLogged(fake);
});
