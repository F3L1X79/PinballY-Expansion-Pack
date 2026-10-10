// ============================================================
// Welcome Screen with the Profile picker off, through main.js on the fake
// PinballY globals, at noon: the greeting names no Profile and no Avatar
// shows; the cross is selected on opening, Guest having no Play the stay
// choice names the wheel, and Select on the cross closes the screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import {
    WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, greeting, headerImages, highlighted, readChoices,
} from "./welcome_screen_reader.js";

test("without the Profile picker, the Welcome Screen shows no Avatar nor name and starts on the cross", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 12, 0, 0) });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt";
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const TEXT = lang.welcomeScreen;
    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);

    assert.equal(greeting(fake), TEXT.greetingAlone(TEXT.greetings.afternoon));
    assert.deepEqual(headerImages(fake), []);
    assert.deepEqual(highlighted(fake), { label: null, tooltip: TEXT.closeTooltip }, "the cross is selected on opening");
    assert.deepEqual(readChoices(fake), [TEXT.closeTooltip, TEXT.stayOnWheel, TEXT.randomTable]);

    press(fake, "Select");
    assert.equal(isWelcomeScreenOpen(fake), false);
    assert.deepEqual(fake.launches(), []);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
