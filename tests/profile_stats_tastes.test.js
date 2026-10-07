// ============================================================
// The Profile Stats' TASTES section in French, through main.js on the fake
// PinballY globals: the favourite manufacturer and decade with their play
// time in a pill (by play seconds, then games, then alphabetical order,
// never the community tables manufacturer), the favourite table strip (the
// Hall of Fame's first table) and the first table played strip (the
// earliest Play across the Play Log's years, reset copies left out, with
// its date), each with its wheel logo or else its cleaned title; "—"
// everywhere for a Profile with no Play and an empty Play Log.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { openProfileStats, section, sectionImages, press } from "./profile_stats_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const MEDIEVAL_LOGO = "C:\\PinballY\\Media\\Visual Pinball X\\Wheel Images\\Medieval Madness (Williams 1997).png";

function table(id, title, manufacturer, year, extra = {}) {
    return {
        id, configId: `${title} (${manufacturer} ${year})`, title, manufacturer, year, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, isConfigured: true, ...extra,
    };
}

const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997, { wheelImage: MEDIEVAL_LOGO });
// A lost "™", raw then read as Windows-1252, then a parenthetical suffix.
const MARS = table(2, "Attack from Mars\uFFFD \u00EF\u00BF\u00BD (Remake)", "Bally", 1995);
const GODZILLA = table(3, "Godzilla", "Stern", 2021);
const COMMUNITY = table(4, "Homemade Table", config.communityTablesManufacturer, 2023);

const play = (count, seconds) => ({ count, seconds, lastPlayed: "2026-09-20T20:00:00" });
const playLog = plays => JSON.stringify({ version: 1, plays });
const logged = (start, configId) => ({ start, configId, seconds: 600 });

test("the TASTES section shows the favourites and the favourite and first table strips", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 7, 10, 0, 0), tables: [MEDIEVAL, MARS, GODZILLA, COMMUNITY] });
    fake.addFile(MEDIEVAL_LOGO);
    // Nothing played: no Play Log either.
    fake.addFile(`${PROFILES}\\guest\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [] }));
    // Stern beats Williams and Bally on games at equal time; the community
    // table, played most, is never the favourite manufacturer but counts
    // in its decade. 2020s: 3 h 30.
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({
        version: 1, notified: [],
        plays: {
            [MEDIEVAL.configId]: play(2, 3600),
            [MARS.configId]: play(2, 3600),
            [GODZILLA.configId]: play(3, 3600),
            [COMMUNITY.configId]: play(10, 9000),
        },
    }));
    // Bally and Williams tie on time and games: alphabetical order. Attack
    // from Mars leads the Hall of Fame by its title.
    fake.addFile(`${PROFILES}\\Bob\\profile.json`, JSON.stringify({
        version: 1, notified: [],
        plays: { [MEDIEVAL.configId]: play(3, 4500), [MARS.configId]: play(3, 4500) },
    }));
    // Logged out of order; the reset copy's older Play is gone with the reset.
    fake.addFile(`${PROFILES}\\Bob\\play-log-2026.json`, playLog([logged("2026-01-04T21:00:00", MARS.configId)]));
    fake.addFile(`${PROFILES}\\Bob\\play-log-2025.json`, playLog([
        logged("2025-11-02T20:00:00", MARS.configId),
        logged("2025-03-12T18:30:00", MEDIEVAL.configId),
    ]));
    fake.addFile(`${PROFILES}\\Bob\\play-log-2024.reset-2025-01-01_10-00-00.json`, playLog([logged("2024-05-01T20:00:00", GODZILLA.configId)]));
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["achievements", "hallOfFame"].includes(key);
    config.language = "fr";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    const TEXT = lang.profileStats;
    await import("../main.js");
    await settle();

    openProfileStats(fake, lang);
    assert.deepEqual(section(fake, "GOÛTS", TEXT.stats), {
        "Constructeur favori": ["—"],
        "Décennie favorite": ["—"],
        "Table préférée": ["—"],
        "Première table jouée": ["—"],
    }, "no Play, an empty Play Log");
    assert.deepEqual(sectionImages(fake, "GOÛTS"), [], "no logo");
    press(fake, "Exit");

    getProfileStore().switchTo("Alice");
    openProfileStats(fake, lang);
    const alice = section(fake, "GOÛTS", TEXT.stats);
    assert.deepEqual(alice["Constructeur favori"], ["Stern", "1 h 00 de jeu"]);
    assert.deepEqual(alice["Décennie favorite"], ["Années 2020", "3 h 30 de jeu"]);
    assert.deepEqual(alice["Table préférée"], ["Homemade Table", "Homemade Table", "2 h 30 de jeu"],
        "no logo: its title in the logo's place");
    assert.deepEqual(alice["Première table jouée"], ["—"], "Plays known only by their totals");
    press(fake, "Exit");

    getProfileStore().switchTo("Bob");
    openProfileStats(fake, lang);
    assert.deepEqual(section(fake, "GOÛTS", TEXT.stats), {
        "Constructeur favori": ["Bally", "1 h 15 de jeu"],
        "Décennie favorite": ["Années 1990", "2 h 30 de jeu"],
        "Table préférée": ["Attack from Mars", "Attack from Mars", "1 h 15 de jeu"],
        "Première table jouée": ["Medieval Madness", "le 12/03/2025"],
    });
    assert.deepEqual(sectionImages(fake, "GOÛTS"), [MEDIEVAL_LOGO], "the first table's wheel logo");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
