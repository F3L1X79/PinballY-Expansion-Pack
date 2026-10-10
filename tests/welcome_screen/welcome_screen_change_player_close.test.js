// ============================================================
// Welcome Screen with the Profile picker on: at startup Change Player is
// highlighted, but when the screen comes back after Change Player picked
// another Profile, the cross (Close) is, since the player just changed.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, choose, highlighted } from "./welcome_screen_reader.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const GLIDE_OVER_MS = 500;
// Past the screen's pause and fade, and past a whole Profile Greeting.
const SETTLED_MS = 2500;

test("the Welcome Screen highlights Change Player at startup and Close after a change of player", async () => {
    const fake = createFakePinballYHost();
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "startupChoicePrompt" || key === "profilePicker";
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(highlighted(fake).tooltip, lang.profiles.menuEntry, "Change Player at startup");

    choose(fake, lang.profiles.menuEntry);
    await settle();
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    await settle();
    fake.advanceTime(SETTLED_MS);
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.equal(highlighted(fake).tooltip, lang.welcomeScreen.closeTooltip, "Close after a change of player");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
