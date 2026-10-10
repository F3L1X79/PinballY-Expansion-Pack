// ============================================================
// The Profile Stats values read for any named Profile, through main.js on
// the fake PinballY globals: a Child Profile's values read while an adult
// is active are the ones read while it is active itself, its Player Level
// scaled as on its own Profile Stats, and reading it writes nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { openProfileStats, playerLevel, press } from "./profile_stats_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const HOUR = 3600;
// Past every startup toast.
const ALL_TOASTS_MS = 600000;

const table = (id, title, manufacturer, year, categories = []) => ({
    id, configId: `${title} (${manufacturer} ${year})`, title, manufacturer, year, categories,
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, isConfigured: true,
});
const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997);
const MARS = table(2, "Attack from Mars", "Bally", 1995);
const THEATRE = table(3, "Theatre of Magic", "Bally", 1995);
const PLAYBOY = table(4, "Playboy", "Bally", 1978, ["NSFW"]);

const played = (count, seconds) => ({ count, seconds, lastPlayed: "2026-09-22T20:00:00" });
const playLogJson = starts => JSON.stringify({
    version: 1, plays: starts.map(start => ({ start, configId: MEDIEVAL.configId, seconds: 600 })),
});

// Kid, a Child Profile, is made active once started (without the Profile
// picker, Guest is active at startup), its toasts over, so that it is
// Notified of every Achievement it has; Alice is an adult.
async function start() {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: [MEDIEVAL, MARS, THEATRE, PLAYBOY] });
    fake.addFile(`${PROFILES}\\guest\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [] }));
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [] }));
    fake.addFile(`${PROFILES}\\Kid\\profile.json`, JSON.stringify({
        version: 1,
        isChild: true,
        // The Adult Table's Play, from before the mark, never counts in its collection.
        plays: { [MEDIEVAL.configId]: played(3, 2 * HOUR), [MARS.configId]: played(1, 600), [PLAYBOY.configId]: played(2, HOUR) },
        notified: [],
        challenge: { completedCount: 2, history: [{ completed: false, reached: 1 }] },
    }));
    fake.addFile(`${PROFILES}\\Kid\\play-log-2026.json`, playLogJson(["2026-09-20T21:00:00", "2026-09-21T21:00:00", "2026-09-22T21:00:00"]));
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["achievements", "challenges", "tableMastery"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const { readProfileStats } = await import("../../addons/achievements_engine.js");
    await import("../../main.js");
    await settle();
    getProfileStore().switchTo("Kid");
    fake.advanceTime(ALL_TOASTS_MS);
    return { fake, lang, profileStore: getProfileStore(), readProfileStats };
}

test("a Child Profile's values read while an adult is active are its own, and nothing is written", async () => {
    const { fake, lang, profileStore, readProfileStats } = await start();
    const asActive = readProfileStats();
    openProfileStats(fake, lang);
    const ownLevel = playerLevel(fake, lang.profileStats);
    press(fake, "Exit");

    profileStore.switchTo("Alice");
    const kidFile = fake.readFile(`${PROFILES}\\Kid\\profile.json`);
    const fromAlice = readProfileStats("Kid");

    assert.deepEqual(fromAlice, asActive, "the same values, whichever Profile is active");
    assert.deepEqual(fromAlice.plays, { count: 6, seconds: 3 * HOUR + 600 }, "every Play, the Adult Table's too");
    assert.deepEqual(fromAlice.collection, { played: 2, total: 3 }, "over the tables a child can see");
    assert.equal(fromAlice.dailyStreak.current, 3, "alive all day as yesterday counted");
    assert.deepEqual(fromAlice.challenges, { completed: 2, total: 3 });
    assert.equal(String(fromAlice.playerLevel.level), ownLevel.level, "scaled as on its own Profile Stats");
    assert.ok(ownLevel.current.includes(`${fromAlice.playerLevel.points} /`), "its points too");

    assert.equal(fake.readFile(`${PROFILES}\\Kid\\profile.json`), kidFile, "its profile.json untouched");
    assert.equal(profileStore.getActiveProfile().name, "Alice", "the active Profile untouched");
    assert.deepEqual(readProfileStats().plays, { count: 0, seconds: 0 }, "the active Profile by default");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
