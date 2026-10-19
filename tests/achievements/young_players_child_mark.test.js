// ============================================================
// The Young Players family when a Profile's child mark changes by hand,
// through main.js on the fake PinballY globals: an adult's Play at 16:30
// earns nothing once marked as a child; a child unmarked loses Snack Time
// and gets Night Owl back; marked again, it finds Snack Time Unlocked with
// no new toast.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, showsMissing, showsUnlocked, profileFile } from "./surprises_scenario.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

// Longer than every toast a Profile switch brings.
const ALL_TOASTS_MS = 600000;

test("a Profile's Young Players Achievements follow its child mark", async () => {
    // Monday 5 October 2026.
    const { fake, TEXT, LIST_TEXT, waitUntil, play, listRows, switchTo } = await startSurprisesScenario({ now: new Date(2026, 9, 5, 9, 0, 0) });
    const snackTime = { title: TEXT.snackTimeTitle(), description: TEXT.snackTimeDescription(), hint: TEXT.snackTimeHint() };
    const listsSnackTime = rows => rows.some(row => row.title === snackTime.title || row.description === snackTime.hint);
    const listsNightOwl = rows => rows.some(row => row.description === TEXT.nightOwlHint());
    // Marks or unmarks the Profile by hand while another one is active.
    const markAsChild = (name, isChild) => {
        const data = JSON.parse(fake.files.readText(profileFile(name)));
        fake.addFile(profileFile(name), JSON.stringify({ ...data, isChild }));
    };
    // Switches to the Profile and returns the titles of the toasts the switch brought.
    const toastsOnSwitchTo = async (name) => {
        const before = toastDrawings(fake).length;
        await switchTo(name);
        fake.advanceTime(ALL_TOASTS_MS);
        return toastDrawings(fake).slice(before).flatMap(drawing => drawing.texts);
    };

    await switchTo("Alice");
    waitUntil(2026, 9, 5, 16, 30);
    await play();
    await switchTo("guest");
    markAsChild("Alice", true);
    await switchTo("Alice");
    assert.ok(showsMissing(listRows(), snackTime, LIST_TEXT.secretTitle), "a Play made before Alice was a child does not count");

    await switchTo("Bob");
    assert.ok(!listsNightOwl(listRows()), "a child has no Night Owl");
    waitUntil(2026, 9, 6, 16, 30);
    assert.ok((await play()).includes(snackTime.title));

    await switchTo("guest");
    markAsChild("Bob", false);
    assert.ok(!(await toastsOnSwitchTo("Bob")).includes(snackTime.title));
    const unmarkedRows = listRows();
    assert.ok(!listsSnackTime(unmarkedRows), "no longer a child: no Snack Time");
    assert.ok(listsNightOwl(unmarkedRows), "Night Owl is back");

    await switchTo("guest");
    markAsChild("Bob", true);
    assert.ok(!(await toastsOnSwitchTo("Bob")).includes(snackTime.title), "no new toast");
    assert.ok(showsUnlocked(listRows(), snackTime), "marked again: Snack Time is Unlocked");

    assertNoErrorLogged(fake);
});
