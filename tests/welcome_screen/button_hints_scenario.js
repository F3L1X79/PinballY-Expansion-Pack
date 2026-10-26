// ============================================================
// Button Hints tests' scenario: the Welcome Screen as full as it gets without
// High Scores (Alice with a Daily Streak, both cards with their grey line).
// Never loaded by PinballY.
// - Set config.language before importing this file for another language.
// ============================================================

import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { WELCOME_SCREEN_OPEN_MS } from "./welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// Wednesday 23 September 2026: its week starts Monday 21.
const NOW = new Date(2026, 8, 23, 10, 0, 0);

const table = (id, title) => ({ id, configId: title, title, playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false });
const MEDIEVAL = table(1, "Medieval Madness (Williams 1997)");
const MARS = table(2, "Attack from Mars (Bally 1995)");

// size: the window's, set before the screen opens. Returns { fake, lang }
// with the Welcome Screen open.
export async function startWelcomeScreen({ size = null } = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables: [MEDIEVAL, MARS] });
    if (size) fake.setLayoutSize(size);
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({
        version: 1, notified: [], plays: {},
        streaks: {
            tableOfTheDay: { current: 3, longest: 3, lastPeriod: "2026-09-22", periodsPlayed: 3 },
            tableOfTheWeek: { current: 2, longest: 2, lastPeriod: "2026-09-14", periodsPlayed: 2 },
        },
    }));
    // Another Profile, for Change Player to bring Alice back.
    fake.addFile(`${PROFILES}\\Bob\\profile.json`, JSON.stringify({ version: 1, notified: [], plays: {} }));
    // Two days in a row up to yesterday: a Daily Streak line.
    const entry = start => ({ start, configId: MEDIEVAL.configId, seconds: 600 });
    fake.addFile(`${PROFILES}\\Alice\\play-log-2026.json`, JSON.stringify({ version: 1, plays: [entry("2026-09-21T21:00:00"), entry("2026-09-22T21:00:00")] }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({
        version: 1,
        activeProfile: "Alice",
        tableOfTheDay: { configId: MEDIEVAL.configId, period: "2026-09-23" },
        tableOfTheWeek: { configId: MARS.configId, period: "2026-09-21" },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.startupScreen = "welcome";

    const { default: lang } = await import("../../common/core/i18n.js");
    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    return { fake, lang };
}
