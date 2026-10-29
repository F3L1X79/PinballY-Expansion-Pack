// ============================================================
// Startup Screen "profilePicker" with a PROFILE_PICKER_SOUND_FILE, the
// carousel opened from the main menu before the startup carousel's turn: it
// is the startup one, so it plays the sound once, and its turn adds none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, PICKER_SOUND, pickerSounds } from "./startup_picker_scenario.js";

const SETTLED_MS = 1000;

test("a carousel opened from the main menu during startup plays the Profile picker sound once", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ settings: { profilePickerSoundFile: PICKER_SOUND }, files: [PICKER_SOUND] });
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
    assert.equal(isCarouselOpen(fake, lang), true);
    assert.deepEqual(pickerSounds(fake), [PICKER_SOUND]);

    await settle();
    fake.advanceTime(SETTLED_MS);
    assert.deepEqual(pickerSounds(fake), [PICKER_SOUND], "its turn plays none");
    assertNoErrorLogged(fake);
});
