// ============================================================
// The drawn Profile Stats in French, through main.js on the fake PinballY
// globals, with the Tables to Discover Add-on off: a Profile with no Play
// shows "—" for its average, no Most Played Tables button and its
// PROGRESSION at zero, without "Record en cours !" at Streak 0, and no
// Tables to Discover button ever shows; another Profile's games of over an
// hour show their average in hours, its totals thousands separated, and an
// average just under an hour rounds up to "1 h 00".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { openProfileStats, buttons, section, cardTexts, press } from "./profile_stats_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

const MEDIEVAL = {
    id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", manufacturer: "Williams", year: 1997, categories: [],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, isConfigured: true,
};

test("no Play shows a dash and no selection button; long games show hours", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: [MEDIEVAL] });
    fake.addFile(`${PROFILES}\\guest\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [] }));
    // 1,500 games of 1 h 30 on average.
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({
        version: 1, notified: [],
        plays: { [MEDIEVAL.configId]: { count: 1500, seconds: 1500 * 5400, lastPlayed: "2026-09-20T20:00:00" } },
    }));
    // One game of 59 min 40 s: an hour once rounded.
    fake.addFile(`${PROFILES}\\Bob\\profile.json`, JSON.stringify({
        version: 1, notified: [],
        plays: { [MEDIEVAL.configId]: { count: 1, seconds: 3580, lastPlayed: "2026-09-20T20:00:00" } },
    }));
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["achievements", "hallOfFame"].includes(key);
    config.language = "fr";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    const TEXT = lang.profileStats;
    await import("../main.js");
    await settle();

    openProfileStats(fake, lang);
    assert.equal(cardTexts(fake)[0], "Invité");
    assert.deepEqual(buttons(fake).map(button => button.label), ["Succès"], "nothing played, Tables to Discover off");
    assert.deepEqual(section(fake, "JEU", TEXT.stats), {
        "Parties jouées": ["0"],
        "Temps total": ["0 h 00"],
        "Durée moyenne": ["—"],
    });
    assert.deepEqual(section(fake, "PROGRESSION", TEXT.stats), {
        "Collection": ["0/1", "0 %"],
        "Série du jour": ["0", "Record : 0"],
        "Série de la semaine": ["0", "Record : 0"],
    }, "no completed Challenges with the Challenges Add-on off");
    press(fake, "Exit");

    getProfileStore().switchTo("Alice");
    openProfileStats(fake, lang);
    assert.deepEqual(buttons(fake).map(button => button.label), ["Succès", "Tables les plus jouées"]);
    assert.deepEqual(section(fake, "JEU", TEXT.stats), {
        "Parties jouées": ["1\u00A0500"],
        "Temps total": ["2250 h 00"],
        "Durée moyenne": ["1 h 30"],
    });
    press(fake, "Exit");

    getProfileStore().switchTo("Bob");
    openProfileStats(fake, lang);
    assert.deepEqual(section(fake, "JEU", TEXT.stats)["Durée moyenne"], ["1 h 00"]);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
