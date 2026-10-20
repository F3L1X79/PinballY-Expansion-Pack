// ============================================================
// Startup Screen "profilePicker" with a PROFILE_PICKER_SOUND_FILE: the
// sound plays once, as the carousel appears at the end of the startup
// pause; the greeting after a quick pick takes over without an error.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { press, isWelcomeScreenOpen, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, PICKER_SOUND, pickerSounds, CAROUSEL_PAUSE_MS } from "./startup_picker_scenario.js";

const GREETING_SOUND = "C:\\Sounds\\greeting.mp3";

test("the Profile picker sound plays once, as the startup carousel appears, and the greeting follows without an error", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({
        settings: { profilePickerSoundFile: PICKER_SOUND, profileGreetingSoundFile: GREETING_SOUND }, files: [PICKER_SOUND, GREETING_SOUND],
    });
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS - 1);
    assert.equal(isCarouselOpen(fake, lang), false);
    assert.deepEqual(pickerSounds(fake), [], "not during the startup pause");
    fake.advanceTime(1);
    assert.equal(isCarouselOpen(fake, lang), true);
    assert.deepEqual(pickerSounds(fake), [PICKER_SOUND], "as the carousel appears");

    press(fake, "Select");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(fake.soundsPlayed(), [PICKER_SOUND, GREETING_SOUND], "the greeting follows");
    assertNoErrorLogged(fake);
});
