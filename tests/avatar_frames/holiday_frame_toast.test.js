// ============================================================
// The Christmas Holiday Frame toast, through main.js on the fake PinballY
// globals: the Play that unlocks it gets one toast of its own, showing the
// frame, on the return to the wheel; a second Play that day and the next
// Christmas get none, and nothing is stored for it in profile.json.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, allToasts, play, profileFile, TABLES, MINUTE, ALL_TOASTS_MS } from "../mastery/mastery_bar_scenario.js";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const [FIRST, SECOND] = TABLES;
const CHRISTMAS_EVE = new Date(2026, 11, 24, 18, 0, 0);
const CHRISTMAS_TOAST = "HOLIDAY FRAME | New frame: Christmas | A Play on 24 or 25 December";
const frameToasts = fake => allToasts(fake).filter(texts => texts.startsWith("HOLIDAY FRAME"));

test("the Play that unlocks Christmas gets one toast showing the frame; later Christmas Plays get none", async () => {
    const fake = await startScenario({
        addOns: ["achievements", "customMenuCommands", "profilePicker"], frameImages: true, now: CHRISTMAS_EVE,
        // Already prompted: only the toast is looked at here.
        profiles: { guest: { avatarFrame: null } },
    });
    fake.advanceTime(ALL_TOASTS_MS);

    await play(fake, FIRST, 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(frameToasts(fake), [CHRISTMAS_TOAST]);
    const drawing = toastDrawings(fake).find(candidate => candidate.texts[0] === "HOLIDAY FRAME");
    assert.equal(drawing.images.some(path => path.endsWith("\\frame_christmas_192.png")), true, "the tile shows the frame");

    await play(fake, SECOND, 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    fake.setNow(new Date(2027, 11, 25, 18, 0, 0));
    await play(fake, FIRST, 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);

    assert.deepEqual(frameToasts(fake), [CHRISTMAS_TOAST], "never again");
    assert.equal(JSON.parse(fake.readFile(profileFile("guest"))).avatarFrame, null, "nothing stored");
    assertNoErrorLogged(fake);
});
