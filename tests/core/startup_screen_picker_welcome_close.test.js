// ============================================================
// Startup Screen "profilePicker": the player was just picked, so the
// Welcome Screen that follows highlights the cross (Close), as after
// Change Player, not Change Player again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { press, isWelcomeScreenOpen, highlighted, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, CAROUSEL_PAUSE_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

test("the Welcome Screen after the startup Profile picker highlights Close", async () => {
    const { fake, lang, settle } = await startOnProfilePicker();
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS);
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.equal(highlighted(fake).tooltip, lang.buttonHints.close, "Close, the player was just picked");
    assertNoErrorLogged(fake);
});
