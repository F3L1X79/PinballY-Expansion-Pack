// ============================================================
// The drawn Profile Stats, through main.js on the fake PinballY globals:
// "Your Stats" in the main menu opens them over the wheel, no native menu;
// the card names the active Profile under its Avatar, with the Achievements,
// Most Played Tables and Tables to Discover buttons at its foot; the GAME
// section sums every table played, hidden and removed ones included; the
// cross is selected on opening, Next / Prev loop with the navigation
// sound, every button is swallowed, Exit and Select on the cross close
// them, attract mode too, and every number is read again on each opening.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import {
    press, isProfileStatsOpen, profileStatsLayerCount, openProfileStats, cardTexts, cardImages, buttons, section,
    highlighted, readChoices, choose,
} from "./profile_stats_reader.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const NAVIGATION_SOUND = "C:\\PinballY\\Assets\\Button Sounds\\Next.wav";

function table(id, title, { isHidden = false } = {}) {
    return {
        id, configId: `${title} (Williams 1990)`, title, manufacturer: "Williams", year: 1990, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden, isConfigured: true,
    };
}

const MEDIEVAL = table(1, "Medieval Madness");
const MARS = table(2, "Attack from Mars");
const GODZILLA = table(3, "Godzilla");
const SHUTTLE = table(4, "Space Shuttle", { isHidden: true });

const play = (count, seconds) => ({ count, seconds, lastPlayed: "2026-09-20T20:00:00" });

test("the Profile Stats show the Profile, its buttons and its GAME totals, and drive like the Welcome Screen", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [MEDIEVAL, MARS, GODZILLA, SHUTTLE] });
    // 1,206 games in 96 h 20, over two visible tables, a hidden one and a
    // table no longer in PinballY's list.
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({
        version: 1, notified: [],
        plays: {
            [MEDIEVAL.configId]: play(1200, 340000),
            [MARS.configId]: play(1, 900),
            [SHUTTLE.configId]: play(2, 1800),
            "Removed Table (Bally 1980)": play(3, 4100),
        },
    }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    fake.addFile(NAVIGATION_SOUND);
    fake.setWheelTables([MARS.configId, MEDIEVAL.configId, GODZILLA.configId]);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["achievements", "hallOfFame", "tablesToDiscover", "profilePicker"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const TEXT = lang.profileStats;
    await import("../../main.js");
    await settle();

    openProfileStats(fake, lang);
    assert.equal(isProfileStatsOpen(fake), true);
    assert.equal(fake.currentMenu(), null, "no native menu");
    assert.equal(cardTexts(fake)[0], "Alice");
    assert.deepEqual(cardImages(fake), [getProfileStore().getActiveProfile().avatarPath], "the active Profile's Avatar");
    assert.deepEqual(buttons(fake).map(button => button.label), [TEXT.buttons.achievements, TEXT.buttons.mostPlayedTables, TEXT.buttons.tablesToDiscover]);
    assert.deepEqual(buttons(fake).slice(1).map(button => button.count), ["2", "1"]);
    assert.match(buttons(fake)[0].count, /^\d+\/\d+$/);
    assert.deepEqual(section(fake, TEXT.sections.game, TEXT.stats), {
        [TEXT.stats.gamesPlayed]: ["1,206"],
        [TEXT.stats.totalTime]: ["96 h 20"],
        [TEXT.stats.averageDuration]: ["5 min"],
    });

    assert.equal(highlighted(fake), TEXT.closeTooltip, "the cross is selected on opening");
    assert.deepEqual(readChoices(fake), [TEXT.closeTooltip, TEXT.buttons.achievements, TEXT.buttons.mostPlayedTables, TEXT.buttons.tablesToDiscover]);
    assert.deepEqual(fake.soundsPlayed(), Array(4).fill(NAVIGATION_SOUND), "each move plays the navigation sound");
    press(fake, "Prev");
    assert.equal(highlighted(fake), TEXT.buttons.tablesToDiscover, "Prev loops back to the last choice");
    for (const button of ["Next", "Prev", "Info", "Coin"]) {
        assert.equal(press(fake, button).defaultPrevented, true, `${button} is swallowed`);
    }
    assert.equal(fake.getCurrentTable().configId, MARS.configId, "the wheel never moved");

    press(fake, "Exit");
    assert.equal(isProfileStatsOpen(fake), false, "Exit closes them");
    assert.equal(profileStatsLayerCount(fake), 0, "their layers are removed");
    assert.equal(press(fake, "Next").defaultPrevented, false, "the buttons drive the wheel again");

    // A first game on Godzilla: read again on the next opening.
    fake.gameStarted(GODZILLA);
    await settle();
    fake.advanceTime(10 * 60 * 1000);
    fake.gameOver(GODZILLA);
    await settle();
    openProfileStats(fake, lang);
    assert.deepEqual(section(fake, TEXT.sections.game, TEXT.stats)[TEXT.stats.gamesPlayed], ["1,207"]);
    assert.deepEqual(buttons(fake).map(button => button.label), [TEXT.buttons.achievements, TEXT.buttons.mostPlayedTables],
        "no Tables to Discover once every table was played");
    assert.equal(buttons(fake)[1].count, "3");
    choose(fake, TEXT.closeTooltip);
    assert.equal(isProfileStatsOpen(fake), false, "Select on the cross closes them");
    assert.equal(fake.getUIMode(), "wheel");

    openProfileStats(fake, lang);
    fake.fire("attractmodestart");
    assert.equal(isProfileStatsOpen(fake), false, "attract mode closes them");
    assert.equal(press(fake, "Next").defaultPrevented, false);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
