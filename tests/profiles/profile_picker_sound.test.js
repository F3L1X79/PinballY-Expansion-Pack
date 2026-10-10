// ============================================================
// Profile picker's navigation sound, through main.js on the fake PinballY
// globals: each Next / Prev in the carousel plays PinballY's own Next.wav,
// quick presses on players in turn; opening, picking and buttons pressed
// once it is closed play nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const NAVIGATION_SOUND = "C:\\PinballY\\Assets\\Button Sounds\\Next.wav";
const GREETING_OVER_MS = 2500;

const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

test("each Next / Prev in the carousel plays PinballY's navigation sound", async () => {
    const fake = createFakePinballYHost();
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    fake.addFile(NAVIGATION_SOUND);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "profilePicker";
    config.language = "en";
    config.profileGreetingSoundFile = "";

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();
    fake.advanceTime(GREETING_OVER_MS);

    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
    await settle();
    assert.deepEqual(fake.soundsPlayed(), [], "opening plays nothing");

    for (const button of ["Next", "Next", "Prev", "Next"]) press(fake, button);
    press(fake, "Select");
    press(fake, "Next");

    assert.deepEqual(fake.soundsPlayed(), Array(4).fill(NAVIGATION_SOUND), "only the moves inside the carousel");
    const [first, second, third, fourth] = fake.soundPlayers();
    assert.equal(new Set([first, second, third]).size, 3, "three different players");
    assert.equal(fourth, first);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
