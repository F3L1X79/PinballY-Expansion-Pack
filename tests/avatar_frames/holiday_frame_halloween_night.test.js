// ============================================================
// One Play across midnight on Halloween night, through main.js on the
// fake PinballY globals: it wins Halloween and Día de los Muertos, a
// toast for each on the return to the wheel, each showing its frame.
// Never loaded by PinballY.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, allToasts, play, TABLES, MINUTE, ALL_TOASTS_MS } from "../mastery/mastery_bar_scenario.js";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const [FIRST] = TABLES;
const HALLOWEEN_NIGHT = new Date(2026, 9, 31, 23, 50, 0);
const frameToasts = fake => allToasts(fake).filter(texts => texts.startsWith("HOLIDAY FRAME"));

test("a Play from 31 October 23:50 to 1 November 00:10 gets a Halloween toast and a Día de los Muertos toast", async () => {
    const fake = await startScenario({
        addOns: ["achievements", "customMenuCommands", "profilePicker"], frameImages: true, now: HALLOWEEN_NIGHT,
        // Already prompted: only the toasts are looked at here.
        profiles: { guest: { avatarFrame: null } },
    });

    await play(fake, FIRST, 20 * MINUTE);
    fake.advanceTime(2 * ALL_TOASTS_MS);

    assert.deepEqual(frameToasts(fake), [
        "HOLIDAY FRAME | New frame: Halloween | A Play on 31 October",
        "HOLIDAY FRAME | New frame: Día de los Muertos | A Play on 1 or 2 November",
    ]);
    const tiles = toastDrawings(fake).filter(drawing => drawing.texts[0] === "HOLIDAY FRAME").flatMap(drawing => drawing.images);
    assert.equal(tiles.some(path => path.endsWith("\\frame_halloween_192.png")), true);
    assert.equal(tiles.some(path => path.endsWith("\\frame_deadDay_192.png")), true);
    assertNoErrorLogged(fake);
});
