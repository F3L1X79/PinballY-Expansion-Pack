// ============================================================
// Welcome Screen in French, through main.js on the fake PinballY globals,
// at 19 h: a menu opened before the startup pause ends keeps it closed
// until the menu closes and another pause ends; it greets the Profile by
// its name with the evening greeting, offers to stay on the wheel when
// no table is selected, shows the Avatar's tooltip in French, and Exit closes it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, greeting, bottomRowLabels, highlighted } from "./welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

test("the Welcome Screen waits for a menu to close, greets in the evening and closes on Exit", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 19, 0, 0) });
    fake.addFolder(`${PROFILES}\\Chloé`);
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Chloé" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "fr";

    const { default: lang } = await import("../common/i18n.js");
    await import("../main.js");
    await settle();

    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), false, "not over a menu");
    fake.closeMenu();
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), false, "a new pause first");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);

    assert.equal(greeting(fake), `${lang.welcomeScreen.greetings.evening}, Chloé !`);
    assert.deepEqual(bottomRowLabels(fake), ["Rester sur la roue", "Lancer une table au hasard"]);
    assert.deepEqual(highlighted(fake), { label: null, tooltip: "Changer de joueur" });

    press(fake, "Exit");
    assert.equal(isWelcomeScreenOpen(fake), false);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
