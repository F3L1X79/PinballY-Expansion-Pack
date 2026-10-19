// ============================================================
// Welcome Screen from the main menu with the Profile picker off: Guest gets
// the entry, and the screen offers no Change Player, as at startup.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, readChoices, openFromMainMenu } from "./welcome_screen_reader.js";

test("without the Profile picker, the Welcome Screen from the main menu has no Change Player", async () => {
    const fake = createFakePinballYHost();
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt";
    config.language = "en";

    const { default: lang } = await import("../../common/core/i18n.js");
    const TEXT = lang.welcomeScreen;
    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    press(fake, "Exit");
    await settle();

    await openFromMainMenu(fake, TEXT.menuEntry);
    assert.equal(isWelcomeScreenOpen(fake), true, "Guest gets the entry");
    assert.deepEqual(readChoices(fake), [lang.buttonHints.close, TEXT.randomTable, TEXT.stayOnWheel]);
    press(fake, "Exit");
    await settle();
    assertNoErrorLogged(fake);
});
