// ============================================================
// Startup Screen "profilePicker" with a PROFILE_PICKER_SOUND_FILE that
// cannot play: the failure is logged under [ProfilePicker] and the
// carousel still opens.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_OPEN_MS } from "./startup_picker_scenario.js";

test("a missing Profile picker sound is logged and the carousel still opens", async () => {
    // The file is never added: it is missing.
    const { fake, lang, settle } = await startOnProfilePicker({ settings: { profilePickerSoundFile: "C:\\Sounds\\missing.mp3" } });
    await settle();
    fake.advanceTime(CAROUSEL_OPEN_MS);
    assert.equal(isCarouselOpen(fake, lang), true);
    const errors = errorLines(fake);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].startsWith("[ProfilePicker] ERROR") && errors[0].includes("missing.mp3"), errors[0]);
});
