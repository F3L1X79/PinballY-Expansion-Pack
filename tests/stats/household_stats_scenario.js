// ============================================================
// Starts the pack through main.js on the fake PinballY globals with a
// Household for the Household Stats tests: Guest and the named Profiles,
// each with its own profile.json and Play Log, the Achievements,
// Challenges and Table Mastery Add-ons on unless told otherwise, English
// texts, PinballY's navigation sound, every startup toast over. Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

export const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
export const HOUR = 3600;
export const NAVIGATION_SOUND = "C:\\PinballY\\Assets\\Button Sounds\\Next.wav";
export const DEFAULT_AVATAR = "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\default_avatar.png";
// Past every startup toast.
const ALL_TOASTS_MS = 600000;

const table = (id, title, manufacturer, year) => ({
    id, configId: `${title} (${manufacturer} ${year})`, title, manufacturer, year, categories: [],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, isConfigured: true,
});
export const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997);
export const MARS = table(2, "Attack from Mars", "Bally", 1995);
export const THEATRE = table(3, "Theatre of Magic", "Bally", 1995);
export const TWILIGHT = table(4, "Twilight Zone", "Bally", 1993);

export const played = (count, seconds) => ({ count, seconds, lastPlayed: "2026-09-22T20:00:00" });

const playLogJson = starts => JSON.stringify({
    version: 1, plays: starts.map(start => ({ start, configId: MEDIEVAL.configId, seconds: 600 })),
});

// profiles: { [name]: { plays, challenge, playLog (Play starts), isChild,
// avatar (true: its own avatar.png) } }, Guest always there; active: the
// Profile switched to once started (Guest otherwise); addOns: the Add-ons on;
// hasDefaultAvatar: false leaves the default Avatar image out of the install.
export async function startHousehold({ profiles = {}, active = null, addOns = ["achievements", "challenges", "tableMastery"], hasDefaultAvatar = true } = {}) {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: [MEDIEVAL, MARS, THEATRE, TWILIGHT] });
    const all = { guest: {}, ...profiles };
    for (const [name, profile] of Object.entries(all)) {
        fake.addFile(`${PROFILES}\\${name}\\profile.json`, JSON.stringify({
            version: 1, plays: profile.plays || {}, notified: [], isChild: profile.isChild === true,
            ...(profile.challenge ? { challenge: profile.challenge } : {}),
        }));
        if (profile.playLog) fake.addFile(`${PROFILES}\\${name}\\play-log-2026.json`, playLogJson(profile.playLog));
        if (profile.avatar) fake.addFile(`${PROFILES}\\${name}\\avatar.png`, "png");
    }
    if (hasDefaultAvatar) fake.addFile(DEFAULT_AVATAR, "png");
    fake.addFile(NAVIGATION_SOUND);
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = addOns.includes(key);
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const { readProfileStats } = await import("../../addons/achievements_engine.js");
    await import("../../main.js");
    await settle();
    if (active) getProfileStore().switchTo(active);
    fake.advanceTime(ALL_TOASTS_MS);
    return { fake, lang, profileStore: getProfileStore(), readProfileStats };
}

export const errorLines = fake => fake.logLines().filter(line => line.includes("ERROR"));
