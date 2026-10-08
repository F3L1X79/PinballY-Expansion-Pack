// ============================================================
// Daily Streak on the Welcome Screen, through main.js on the fake PinballY
// globals, in English: the grey line under the greeting shows the active
// Profile's days in a row on the cabinet from 2 days on, read from its
// Play Log, asking to keep it going while today has no Play yet. A launch
// under a minute does not count; a Play does, and the line comes back
// without the call once a Profile switch (as Change Player makes) brings
// the Profile back. Another
// Profile keeps its own Daily Streak: a broken one shows no line.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, greeting, dailyStreakLine } from "./welcome_screen_reader.js";

// Wednesday 7 October 2026, in the morning.
const NOW = new Date(2026, 9, 7, 10, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const MEDIEVAL = {
    id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness (Williams 1997)",
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
};

const entry = start => ({ start, configId: MEDIEVAL.configId, seconds: 600 });
const playLogJson = starts => JSON.stringify({ version: 1, plays: starts.map(entry) });

test("the Welcome Screen shows the active Profile's Daily Streak from 2 days on", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [MEDIEVAL] });
    // Two days in a row up to yesterday, one of them with two Plays.
    fake.addFile(`${PROFILES}\\Alice\\play-log-2026.json`, playLogJson(["2026-10-05T21:00:00", "2026-10-06T20:00:00", "2026-10-06T22:30:00"]));
    // Two days in a row, broken on Monday.
    fake.addFile(`${PROFILES}\\Bob\\play-log-2026.json`, playLogJson(["2026-10-03T21:00:00", "2026-10-04T21:00:00"]));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    const TEXT = lang.welcomeScreen.cabinetStreak;
    const store = getProfileStore();
    await import("../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);

    assert.equal(TEXT.notYetToday, "days in a row on the cabinet: keep it going!", "the count is in the square before it");
    assert.equal(dailyStreakLine(fake), `2 ${TEXT.notYetToday}`, "today still has no Play");
    assert.ok(greeting(fake).includes("Alice"), "the greeting stays apart from the line");
    press(fake, "Exit");

    async function playFor(seconds) {
        fake.gameStarted(MEDIEVAL);
        fake.advanceTime(seconds * 1000);
        fake.gameOver(MEDIEVAL);
        await settle();
    }
    async function switchTo(name) {
        store.switchTo(name);
        await settle();
        fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    }

    await playFor(30);
    await switchTo("Bob");
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.equal(dailyStreakLine(fake), null, "Bob's Daily Streak is broken");
    press(fake, "Exit");

    await switchTo("Alice");
    assert.equal(dailyStreakLine(fake), `2 ${TEXT.notYetToday}`, "a launch under a minute does not count");
    press(fake, "Exit");

    await playFor(90);
    await switchTo("Bob");
    assert.equal(dailyStreakLine(fake), null, "Alice's Play is not Bob's");
    press(fake, "Exit");

    await switchTo("Alice");
    assert.equal(TEXT.playedToday, "days in a row on the cabinet");
    assert.equal(dailyStreakLine(fake), `3 ${TEXT.playedToday}`, "today counts once played");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
