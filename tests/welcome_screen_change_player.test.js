// ============================================================
// Welcome Screen with the Profile picker on, through main.js on the fake
// PinballY globals: Select on the Avatar closes the screen and opens the
// carousel on the active Profile; picking another Profile there, or from
// the main menu's Change Player, brings the screen back for that Profile
// instead of the Profile Greeting. Leaving the carousel on the same
// Profile, by Select or Exit, brings back neither.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, choose, greeting } from "./welcome_screen_reader.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// The carousel's background, its Avatars, then the gold frame and names.
const PICKER_Z_RANGE = [6500, 6502];
const GLIDE_OVER_MS = 500;
// Past the screen's pause and fade, and past a whole Profile Greeting.
const SETTLED_MS = 2500;

const pickerTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex >= PICKER_Z_RANGE[0] && layer.zIndex <= PICKER_Z_RANGE[1] && layer.alpha > 0)
    .flatMap(layer => layer.texts());

test("Change Player from the Welcome Screen or the main menu brings the screen back for the new Profile", async () => {
    const fake = createFakePinballYHost();
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "startupChoicePrompt" || key === "profilePicker";
    }
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    const store = getProfileStore();
    await import("../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    const greetings = () => ["Alice", "Bob"].map(name => lang.profiles.greeting(name))
        .filter(text => pickerTexts(fake).includes(text));
    const pickFromMainMenu = () => {
        fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
        fake.selectMenuItem(lang.profiles.menuEntry);
    };
    // Lets the carousel's glide and whatever follows the pick play out.
    const playOut = async () => {
        await settle();
        fake.advanceTime(SETTLED_MS);
        await settle();
    };

    choose(fake, lang.profiles.menuEntry);
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), false);
    assert.ok(pickerTexts(fake).includes("Bob"), "the carousel opens on the active Profile");

    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    assert.equal(store.getActiveProfile().name, "Alice");
    await playOut();
    assert.equal(isWelcomeScreenOpen(fake), true, "the screen comes back after the switch");
    assert.ok(greeting(fake).includes("Alice"), "for the new Profile");
    assert.deepEqual(greetings(), [], "instead of the Profile Greeting");
    assert.deepEqual(pickerTexts(fake), [], "the carousel is gone");

    press(fake, "Exit");
    pickFromMainMenu();
    await settle();
    press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    assert.equal(store.getActiveProfile().name, "Bob");
    await playOut();
    assert.equal(isWelcomeScreenOpen(fake), true, "from the main menu too");
    assert.ok(greeting(fake).includes("Bob"));
    assert.deepEqual(greetings(), []);

    press(fake, "Exit");
    pickFromMainMenu();
    await settle();
    press(fake, "Select");
    await playOut();
    assert.equal(store.getActiveProfile().name, "Bob");
    assert.equal(isWelcomeScreenOpen(fake), false, "the same Profile picked brings nothing back");
    assert.deepEqual(greetings(), []);
    assert.deepEqual(pickerTexts(fake), [], "and the carousel is gone");

    pickFromMainMenu();
    await settle();
    press(fake, "Exit");
    await playOut();
    assert.equal(isWelcomeScreenOpen(fake), false, "nor does leaving the carousel with Exit");
    assert.deepEqual(greetings(), []);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
