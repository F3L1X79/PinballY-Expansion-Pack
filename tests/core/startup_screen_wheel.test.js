// ============================================================
// Startup Screen "wheel": PinballY starts on the bare wheel, with no
// Welcome Screen, veil or Loader; a toast pending at startup shows at once,
// the last active Profile is greeted once, and the main menu entry still
// opens the Welcome Screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { readLoader } from "../support/loader_reader.js";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import { isWelcomeScreenOpen, startupVeil, greeting, openFromMainMenu, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { shownLayers } from "../support/shown_layers.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const PICKER_Z = 6500;
// Enough for a toast to start.
const TOAST_RISE_MS = 1000;
const GREETING_OVER_MS = 2500;

const pickerTexts = fake => shownLayers(fake, PICKER_Z)
    .flatMap(layer => layer.texts());

test("starting on the wheel shows no Welcome Screen, holds no toast and greets the last active Profile", async () => {
    const fake = createFakePinballYHost();
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt" || key === "profilePicker";
    config.language = "en";
    config.startupScreen = "wheel";

    const { default: lang } = await import("../../common/core/i18n.js");
    const { getAchievementToasts } = await import("../../common/achievements/achievement_toast.js");
    await import("../../main.js");
    assert.deepEqual(startupVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    await settle();

    getAchievementToasts().submit({ title: "Waiting", description: "", onShown() {} });
    fake.advanceTime(TOAST_RISE_MS);
    assert.ok(toastDrawings(fake).length > 0, "the toast shows without waiting");
    assert.ok(pickerTexts(fake).includes(lang.profiles.greeting("Bob")), "the last active Profile is greeted");
    assert.equal(isWelcomeScreenOpen(fake), false, "no Welcome Screen");
    fake.advanceTime(GREETING_OVER_MS);
    assert.equal(pickerTexts(fake).includes(lang.profiles.greeting("Bob")), false, "the greeting fades out");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), false, "still no Welcome Screen");
    assert.deepEqual(startupVeil(fake), { shown: false });

    await openFromMainMenu(fake, lang.welcomeScreen.menuEntry);
    assert.equal(isWelcomeScreenOpen(fake), true, "the main menu entry opens the Welcome Screen");
    assert.ok(greeting(fake).includes("Bob"));
    assertNoErrorLogged(fake);
});
