// ============================================================
// Welcome Screen, through main.js on the fake PinballY globals, at 5 h
// with the Profile picker on: it opens after the startup pause and not
// before, greets the active Profile by the hour with its Avatar, selects
// the Avatar (its tooltip showing only while selected, like the cross's),
// loops through its choices with Next / Prev and the navigation sound,
// names the table selected on the wheel (title cleaned), not the Last
// Played Table, swallows every button while open so the wheel never moves, and closes
// on Select on Stay.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import {
    WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, greeting, periodCards, headerImages, bottomRowLabels, highlighted, readChoices, choose,
    welcomeScreenLayerCount,
} from "./welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const NAVIGATION_SOUND = "C:\\PinballY\\Assets\\Button Sounds\\Next.wav";

const table = (id, title, configId) => ({ id, configId, title, playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false });
const MEDIEVAL = table(1, "Medieval Madness (Williams 1997)", "Medieval Madness (Williams 1997)");
// A lost "™" read as Windows-1252, then a parenthetical suffix.
const MARS = table(2, "Attack from Mars\u00EF\u00BF\u00BD  Special (Bally 1995)", "Attack from Mars (Bally 1995)");

test("the Welcome Screen opens after the startup pause, greets the Profile and loops through its choices", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 5, 0, 0), tables: [MEDIEVAL, MARS] });
    fake.addFolder(`${PROFILES}\\Bob`);
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({
        version: 1, notified: [],
        plays: {
            [MEDIEVAL.configId]: { count: 3, seconds: 900, lastPlayed: "2026-09-22T21:00:00" },
            [MARS.configId]: { count: 1, seconds: 120, lastPlayed: "2026-09-20T21:00:00" },
        },
    }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    fake.addFile(NAVIGATION_SOUND);
    // The wheel is not on the Last Played Table (Medieval Madness).
    fake.setWheelTables([MARS.configId, MEDIEVAL.configId]);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    const TEXT = lang.welcomeScreen;
    await import("../main.js");
    await settle();

    fake.advanceTime(400);
    assert.equal(isWelcomeScreenOpen(fake), false, "not before the startup pause");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS - 400);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.equal(fake.currentMenu(), null, "no native menu");

    assert.equal(greeting(fake), TEXT.greetingWithName(TEXT.greetings.morning, "Alice").join(""));
    assert.deepEqual(headerImages(fake), [getProfileStore().getActiveProfile().avatarPath], "the active Profile's Avatar");
    assert.deepEqual(bottomRowLabels(fake), [TEXT.stayOn("Attack from Mars Special"), TEXT.randomTable]);
    assert.deepEqual(highlighted(fake), { label: null, tooltip: lang.profiles.menuEntry }, "the Avatar is selected on opening");

    const CARDS = TEXT.periodCards;
    assert.deepEqual(periodCards(fake).map(card => card.line), [null, null], "no grey line without a Streak, nor a Play this Period");
    assert.deepEqual(readChoices(fake), [
        lang.profiles.menuEntry, TEXT.closeTooltip, CARDS.day.period, CARDS.week.period, TEXT.stayOn("Attack from Mars Special"), TEXT.randomTable,
    ]);
    assert.deepEqual(fake.soundsPlayed(), Array(6).fill(NAVIGATION_SOUND), "each move plays the navigation sound");
    press(fake, "Prev");
    assert.deepEqual(highlighted(fake), { label: TEXT.randomTable, tooltip: null }, "Prev loops back to the last choice");

    for (const button of ["Next", "Prev", "Info", "Coin"]) {
        assert.equal(press(fake, button).defaultPrevented, true, `${button} is swallowed`);
    }
    assert.equal(fake.getCurrentTable().configId, MARS.configId, "the wheel never moved");

    choose(fake, TEXT.stayOn("Attack from Mars Special"));
    assert.equal(isWelcomeScreenOpen(fake), false);
    assert.equal(welcomeScreenLayerCount(fake), 0, "its layers are removed");
    assert.equal(press(fake, "Next").defaultPrevented, false, "the buttons drive the wheel again");
    assert.deepEqual(fake.launches(), []);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
