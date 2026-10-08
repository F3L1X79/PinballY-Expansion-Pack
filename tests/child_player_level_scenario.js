// ============================================================
// Scenario of the Child Profile Player Level tests: main.js on the fake
// PinballY globals, in French, with Guest, an adult (Alice) and a child
// (Kid) who all have the same Notified Achievement. Reads the Player Level
// on each Profile's Profile Stats card and what every Achievement a
// Profile has is worth. Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { ACHIEVEMENT_RANK } from "../common/achievements.js";
import { openProfileStats, playerLevel, press } from "./profile_stats_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

const table = (id, title, manufacturer, year, categories) => ({
    id, configId: `${title} (${manufacturer} ${year})`, title, manufacturer, year, categories,
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, isConfigured: true,
});
export const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997, ["Fantasy"]);
export const MARS = table(2, "Attack from Mars", "Bally", 1995, ["SciFi"]);
export const PLAYBOY = table(3, "Playboy", "Bally", 1978, ["NSFW"]);
export const PARTY_NIGHT = table(4, "Party Night", "VPX Community", 2023, ["NSFW"]);

const RANK_POINTS = {
    [ACHIEVEMENT_RANK.BRONZE]: 10, [ACHIEVEMENT_RANK.SILVER]: 25, [ACHIEVEMENT_RANK.GOLD]: 50, [ACHIEVEMENT_RANK.PLATINUM]: 100,
};
// Four Seasons, Gold 50: level 2 for an adult. Its Unlock is lost, which keeps its points.
const NOTIFIED = ["fourSeasons"];
// Night Owl and Full Moon Night, both Gold, which a child never has.
export const KEPT_FROM_CHILD_POINTS = 100;

// tables: the collection, Adult Tables (category "NSFW") or not.
export async function start(tables) {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables });
    fake.addFile(`${PROFILES}\\guest\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: NOTIFIED }));
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: NOTIFIED }));
    fake.addFile(`${PROFILES}\\Kid\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: NOTIFIED, isChild: true }));
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["achievements"].includes(key);
    config.language = "fr";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    const { getAllAchievements } = await import("../addons/achievements_engine.js");
    await import("../main.js");
    await settle();
    const levelOf = name => {
        getProfileStore().switchTo(name);
        openProfileStats(fake, lang);
        const shown = playerLevel(fake, lang.profileStats);
        press(fake, "Exit");
        return shown;
    };
    // What every Achievement the named Profile has is worth.
    const worthOf = name => {
        getProfileStore().switchTo(name);
        return getAllAchievements().reduce((sum, achievement) => sum + RANK_POINTS[achievement.rank], 0);
    };
    const pointsOf = shown => Number(shown.current.match(/(\d+) \//)[1]);
    return { fake, levelOf, worthOf, pointsOf, profileStore: getProfileStore() };
}
