// ============================================================
// Wednesday Off, a secret of the Young Players family, started through
// main.js on the fake PinballY globals: only a Child Profile's Play started
// on a Wednesday from 13:00 to 18:59 unlocks it, announced in Bronze; a
// Wednesday at 19:00 or a Tuesday afternoon do not, and 16:30 also brings
// Snack Time. While missing, its row shows "???" and its hint.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, showsMissing, showsUnlocked, profileFile } from "./surprises_scenario.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const emblemOf = rank => `C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\rank_${rank}_tile.png`;

test("only a Child Profile's Wednesday afternoon Play unlocks Wednesday Off, in Bronze", async () => {
    // Monday 5 October 2026.
    const { fake, TEXT, LIST_TEXT, waitUntil, play, listRows, switchTo } = await startSurprisesScenario({
        now: new Date(2026, 9, 5, 9, 0, 0),
        files: {
            ...Object.fromEntries(["bronze", "silver", "gold", "platinum"].map(rank => [emblemOf(rank), "PNG"])),
            [profileFile("Kid")]: JSON.stringify({ version: 1, isChild: true }),
        },
    });
    const secret = { title: TEXT.wednesdayOffTitle(), description: TEXT.wednesdayOffDescription(), hint: TEXT.wednesdayOffHint() };
    assert.equal(secret.title, "Wednesday Off");
    assert.equal(secret.description, "Start a game on a Wednesday afternoon.");

    await switchTo("Bob");
    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));

    waitUntil(2026, 9, 6, 15, 0);
    assert.ok(!(await play()).includes(secret.title), "Tuesday at 15:00");
    waitUntil(2026, 9, 7, 19, 0);
    assert.ok(!(await play()).includes(secret.title), "Wednesday at 19:00");
    waitUntil(2026, 9, 14, 13, 0);
    const before = toastDrawings(fake).length;
    assert.ok((await play()).includes(secret.title), "Wednesday at 13:00");
    const toast = toastDrawings(fake).slice(before).find(drawing => drawing.texts.includes(secret.title));
    assert.deepEqual(toast.images, [emblemOf("bronze")], "announced in Bronze");
    assert.ok(showsUnlocked(listRows(), secret));

    await switchTo("Kid");
    waitUntil(2026, 9, 21, 16, 30);
    const titles = await play();
    assert.ok(titles.includes(secret.title) && titles.includes(TEXT.snackTimeTitle()), "Wednesday at 16:30 brings both");

    assertNoErrorLogged(fake);
});
