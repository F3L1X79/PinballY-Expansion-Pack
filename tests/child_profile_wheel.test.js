// ============================================================
// The Child Profile's wheel, started through main.js on the fake PinballY
// globals: while a Profile marked isChild in its profile.json is active,
// no Adult Table (category "NSFW") is on the wheel, under any filter, nor
// drawn by the Random Game, and the Welcome Screen's stay choice never
// leaves the child on one. Switching Profiles brings them back or moves the wheel off them
// at once. A mark on Guest is logged and ignored.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, choose } from "./welcome_screen_reader.js";

const NOW = new Date(2026, 9, 1, 20, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const RANDOM_GAME_COUNT = 30;

const table = (id, configId, manufacturer, categories) => ({ id, configId, title: configId, manufacturer, categories });
const MEDIEVAL = "Medieval Madness (Williams 1997)";
const MARS = "Attack from Mars (Bally 1995)";
const COMMUNITY = "Pirate Cove (VPX 2024)";
const ADULT_COMMUNITY = "Party Night (VPX 2023)";
const ADULT = "Playboy (Bally 1978)";
const TABLES = [
    table(1, ADULT, "Bally", ["NSFW", "Classic"]),
    table(2, MEDIEVAL, "Williams", ["Fantasy"]),
    table(3, MARS, "Bally", []),
    table(4, COMMUNITY, "VPX Community", ["Pirates"]),
    // Matching is exact, like PinballY's category tags.
    table(5, "Night Club (VPX 2022)", "VPX Community", ["nsfw"]),
    table(6, ADULT_COMMUNITY, "VPX Community", ["NSFW"]),
];
// Sorted, as adultOnWheel() gives them.
const ADULT_TABLES = [ADULT_COMMUNITY, ADULT];

const wheel = fake => fake.getWheelTables().map(game => game.configId);
const adultOnWheel = fake => wheel(fake).filter(configId => ADULT_TABLES.includes(configId)).sort();

test("a Child Profile never sees an Adult Table on the wheel, in the Random Game or at startup", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, isChild: true }));
    fake.addFolder(`${PROFILES}\\Bob`);
    fake.addFile(`${PROFILES}\\guest\\profile.json`, JSON.stringify({ version: 1, isChild: true }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // PinballY starts on the table it was last on: an Adult Table here.
    fake.setWheelTables([ADULT, MEDIEVAL, MARS]);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    const addOnsUnderTest = ["startupChoicePrompt", "profilePicker", "customMenuCommands", "customFilter"];
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = addOnsUnderTest.includes(key);
    }
    config.language = "en";
    config.skipRandomGameAnimation = true;

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    await import("../main.js");
    await settle();
    const store = getProfileStore();
    const { gameList } = globalThis;

    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    choose(fake, lang.welcomeScreen.stayOn("Medieval Madness"));
    assert.deepEqual(wheel(fake), [MEDIEVAL, MARS], "the Welcome Screen leaves the child on the next table");

    gameList.setCurFilter("All");
    assert.deepEqual(adultOnWheel(fake), [], "All Tables");
    assert.ok(wheel(fake).includes("Night Club (VPX 2022)"), "another letter case is not the adult category");
    const [originalTables] = fake.scriptFilters();
    fake.selectFilter(`User.${originalTables.id}`);
    assert.deepEqual(wheel(fake), [MEDIEVAL, MARS], "a script filter");
    fake.setWheelTables([ADULT, MARS], { filterId: "Favorites" });
    assert.deepEqual(wheel(fake), [MARS], "one of PinballY's own filters");

    gameList.setCurFilter("All");
    for (let i = 0; i < RANDOM_GAME_COUNT; i++) {
        fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
        fake.selectMenuItem(lang.customMenuLabels.randomGame);
        await settle();
        const launches = fake.launches();
        fake.gameStarted(launches[launches.length - 1]);
        fake.gameOver(launches[launches.length - 1]);
    }
    const drawn = fake.launches().map(game => game.configId);
    assert.equal(drawn.length, RANDOM_GAME_COUNT);
    assert.deepEqual(drawn.filter(configId => ADULT_TABLES.includes(configId)), [], "the Random Game");

    store.switchTo("Bob");
    assert.deepEqual(adultOnWheel(fake), ADULT_TABLES, "another Profile gets them back at once");
    gameList.setWheelGame(wheel(fake).indexOf(ADULT));
    assert.equal(wheel(fake)[0], ADULT);

    store.switchTo("Alice");
    assert.deepEqual(adultOnWheel(fake), [], "back to the child");
    assert.equal(wheel(fake)[0], MEDIEVAL, "the wheel moves off the Adult Table it was on");

    store.switchTo("guest");
    assert.deepEqual(adultOnWheel(fake), ADULT_TABLES, "Guest is never a Child Profile");
    assert.ok(fake.logLines().some(line => line.includes("guest\\profile.json") && line.includes("isChild")));

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
