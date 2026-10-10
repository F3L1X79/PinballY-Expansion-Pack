// ============================================================
// Daily Streak across New Year's Eve on the Welcome Screen, through
// main.js on the fake PinballY globals, with the Profile picker off: a
// Play started on 31 December at 23:50 and ended after midnight counts
// for the day it started, so on 1 January the Daily Streak is still alive
// from yesterday; a Play on 1 January, in the next year's Play Log file,
// keeps it going.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, press, dailyStreakLine } from "./welcome_screen_reader.js";

const NEW_YEARS_EVE = new Date(2026, 11, 31, 23, 50, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const MEDIEVAL = {
    id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness (Williams 1997)",
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
};

test("the Daily Streak survives New Year's Eve and a Play started before midnight counts for its day", async () => {
    const fake = createFakePinballYHost({ now: NEW_YEARS_EVE, tables: [MEDIEVAL] });
    fake.addFile(`${PROFILES}\\guest\\play-log-2026.json`, JSON.stringify({
        version: 1,
        plays: ["2026-12-29T20:00:00", "2026-12-30T20:00:00"].map(start => ({ start, configId: MEDIEVAL.configId, seconds: 600 })),
    }));
    fake.addFolder(`${PROFILES}\\Bob`);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt";
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const TEXT = lang.welcomeScreen.cabinetStreak;
    const store = getProfileStore();
    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(dailyStreakLine(fake), `2 ${TEXT.notYetToday}`, "drawn without the Profile picker too");
    press(fake, "Exit");

    async function playFor(minutes) {
        fake.gameStarted(MEDIEVAL);
        fake.advanceTime(minutes * 60 * 1000);
        fake.gameOver(MEDIEVAL);
        await settle();
    }
    // Guest's Welcome Screen again, through a switch to Bob and back.
    async function welcomeGuestAgain() {
        for (const name of ["Bob", "guest"]) {
            store.switchTo(name);
            await settle();
            fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
            if (name === "Bob") press(fake, "Exit");
        }
    }

    // From 23:50 to 0:10 on 1 January.
    await playFor(20);
    await welcomeGuestAgain();
    assert.equal(fake.now().getDate(), 1, "it is 1 January");
    assert.equal(dailyStreakLine(fake), `3 ${TEXT.notYetToday}`, "31 December counts, 1 January not yet");
    press(fake, "Exit");

    await playFor(5);
    assert.ok(fake.files.fileExists(`${PROFILES}\\guest\\play-log-2027.json`), "the Play is in the new year's file");
    await welcomeGuestAgain();
    assert.equal(dailyStreakLine(fake), `4 ${TEXT.playedToday}`);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
