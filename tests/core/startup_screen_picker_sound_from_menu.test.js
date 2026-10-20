// ============================================================
// Startup Screen "profilePicker" with a PROFILE_PICKER_SOUND_FILE, the
// carousel opened from the main menu during the startup pause: it is the
// startup one, so it plays the sound once, and the pause adds none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, PICKER_SOUND, pickerSounds, CAROUSEL_PAUSE_MS } from "./startup_picker_scenario.js";

test("a carousel opened from the main menu during startup plays the Profile picker sound once", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ settings: { profilePickerSoundFile: PICKER_SOUND }, files: [PICKER_SOUND] });
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS / 2);
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), true);
    assert.deepEqual(pickerSounds(fake), [PICKER_SOUND]);

    fake.advanceTime(CAROUSEL_PAUSE_MS);
    await settle();
    assert.deepEqual(pickerSounds(fake), [PICKER_SOUND], "the end of the pause plays none");
    assertNoErrorLogged(fake);
});
