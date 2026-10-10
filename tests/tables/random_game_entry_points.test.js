// ============================================================
// The Welcome Screen's random choice and the "Start Random Game" main menu
// entry, started through main.js on the fake PinballY globals, never launch
// the active Profile's Last Played Table when the wheel selection holds
// another table, and every one played a minute counts in the Random Games
// played.
// Runs with the Random Game animation turned off (the fake has no wheel
// buttons).
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, choose } from "../welcome_screen/welcome_screen_reader.js";
import { getRandomGame } from "../../common/random_game.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const MENU_LAUNCH_COUNT = 50;
const GUEST_PROFILE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json";

const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness" },
    { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars" },
    { id: 3, configId: "Theatre of Magic (Bally 1995)", title: "Theatre of Magic" },
];
// Guest's most recent play: its Last Played Table at startup.
const LAST_PLAYED_CONFIG_ID = "Theatre of Magic (Bally 1995)";

const ADD_ONS_UNDER_TEST = ["customMenuCommands", "startupChoicePrompt"];

// A one-minute Play each, so each one is Guest's most recent one.
function playAndReturnToWheel(fake, game) {
    fake.gameStarted(game);
    fake.advanceTime(60 * 1000);
    fake.gameOver(game);
}

test("the Welcome Screen and the main menu never launch the Last Played Table, and each Random Game counts", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    fake.setWheelTables([LAST_PLAYED_CONFIG_ID, "Medieval Madness (Williams 1997)", "Attack from Mars (Bally 1995)"]);
    fake.addFile(GUEST_PROFILE_FILE, JSON.stringify({
        version: 1,
        plays: { [LAST_PLAYED_CONFIG_ID]: { count: 1, seconds: 60, lastPlayed: "2026-09-22T20:00:00" } },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    }
    config.language = "en";
    config.skipRandomGameAnimation = true;

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();

    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    choose(fake, lang.welcomeScreen.randomTable);
    await settle();
    const [promptLaunch] = fake.launches();
    playAndReturnToWheel(fake, promptLaunch);

    for (let i = 0; i < MENU_LAUNCH_COUNT; i++) {
        fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
        fake.selectMenuItem(lang.customMenuLabels.randomGame);
        await settle();
        const launches = fake.launches();
        playAndReturnToWheel(fake, launches[launches.length - 1]);
    }

    const launchedConfigIds = fake.launches().map(game => game.configId);
    assert.equal(launchedConfigIds.length, 1 + MENU_LAUNCH_COUNT);
    // Each Random Game avoids the table played just before it.
    const lastPlayedBefore = [LAST_PLAYED_CONFIG_ID, ...launchedConfigIds];
    launchedConfigIds.forEach((configId, i) => assert.notEqual(configId, lastPlayedBefore[i], `launch ${i}`));
    assert.equal(getRandomGame().getRandomGamesPlayed(), 1 + MENU_LAUNCH_COUNT);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
