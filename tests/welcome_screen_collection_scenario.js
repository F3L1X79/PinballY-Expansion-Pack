// ============================================================
// Starts the Welcome Screen through main.js on the fake PinballY globals
// for its Collection Mastery card: numbered tables, each at the Mastery
// Level asked for, played by one Profile (with a kept Collection Tier, or
// as a Child Profile), the screen open and its card read. Each test file
// calls it once: node --test runs each file in its own process. Never
// loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen, collectionCard } from "./welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// The Play seconds that reach each Mastery Level, from level 1.
const SECONDS_AT_LEVEL = [60, 1800, 3600, 6300, 9000, 12600, 18000, 23400, 32400, 43200];

export const tableNumbered = (number, extra = {}) => ({
    id: number, configId: `Table ${number} (Bally 1990)`, title: `Table ${number}`, manufacturer: "Bally", year: 1990,
    categories: [], playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, ...extra,
});

// The totals of a table at that Mastery Level; null for 0, never played.
const playAt = level => (level > 0 ? { count: 1, seconds: SECONDS_AT_LEVEL[level - 1], lastPlayed: "2026-09-22T21:00:00" } : null);

// levels: the Mastery Level of each table, in order. profile: what the
// Profile's profile.json carries besides its Plays. Returns the card, the
// language texts and the log's errors.
export async function openCollectionCard({ tables, levels, profile = {}, language = "en" }) {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables });
    const plays = {};
    tables.forEach((game, index) => {
        const play = playAt(levels[index] || 0);
        if (play) plays[game.configId] = play;
    });
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, notified: [], plays, ...profile }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = language;

    const { default: lang } = await import("../common/i18n.js");
    await import("../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    if (!isWelcomeScreenOpen(fake)) throw new Error("The Welcome Screen did not open.");
    return {
        card: collectionCard(fake),
        TEXT: lang.tableMastery.collection,
        LEVEL_NAMES: lang.tableMastery.levelNames,
        errors: fake.logLines().filter(line => line.includes("ERROR")),
    };
}
