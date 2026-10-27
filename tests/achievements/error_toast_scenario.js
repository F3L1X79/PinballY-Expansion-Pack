// ============================================================
// Error Toast tests' scenario: main.js on the fake globals with every
// Add-on off but those asked for, one Profile active. Plays a table with
// one of its files locked, and watches the toast cards on screen.
// Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { ACHIEVEMENT_TOAST_Z_INDEX } from "../../common/achievements/achievement_toast.js";
import config from "../../common/core/config.js";

const NOW = new Date(2026, 9, 27, 20, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
export const profileFile = name => `${PROFILES}\\${name}\\profile.json`;
export const playLogFile = name => `${PROFILES}\\${name}\\play-log-2026.json`;
export const MARS = {
    id: 1, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", manufacturer: "Bally", year: 1995,
    categories: [], isConfigured: true, isHidden: false,
};
const STEP_MS = 100;
// Long enough for a Level Toast that waits for the Confetti Shower's end,
// the screen empty meanwhile.
const WATCH_MS = 120000;

// Each card on screen, oldest (highest) first, as "HEADER | title | description".
const cardsOnScreen = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === ACHIEVEMENT_TOAST_Z_INDEX && layer.texts().length > 0 && layer.alpha > 0)
    .sort((a, b) => b.position().y - a.position().y)
    .map(layer => layer.texts().join(" | "));

// Every card shown within WATCH_MS, in arrival order, with how long it
// stayed fully or partly visible: { text, shownMs }.
export function watchCards(fake) {
    const seen = new Map();
    for (let elapsedMs = 0; elapsedMs < WATCH_MS; elapsedMs += STEP_MS) {
        for (const text of cardsOnScreen(fake)) {
            if (!seen.has(text)) seen.set(text, { text, firstMs: elapsedMs, lastMs: elapsedMs });
            seen.get(text).lastMs = elapsedMs;
        }
        fake.advanceTime(STEP_MS);
    }
    return [...seen.values()].map(({ text, firstMs, lastMs }) => ({ text, shownMs: lastMs - firstMs }));
}

// profile: the active Profile's name and its profile.json data; addOns:
// the Add-ons left on; files: { path: content } added before the start.
// The startup's own toasts are over when it returns.
export async function startErrorToastScenario({ profile = { name: "Alice", data: {} }, addOns = [], files = {} } = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables: [MARS] });
    fake.addFile(profileFile(profile.name), JSON.stringify({ version: 1, ...profile.data }));
    for (const [path, content] of Object.entries(files)) fake.addFile(path, content);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = addOns.includes(key);
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    getProfileStore().switchTo(profile.name);
    await settle();
    watchCards(fake);
    return { fake, profileStore: getProfileStore() };
}

// Five minutes of MARS with lockedPath locked, back to the wheel.
export async function playLocked(fake, lockedPath) {
    fake.lockFile(lockedPath);
    fake.gameStarted(MARS);
    fake.advanceTime(5 * 60 * 1000);
    fake.gameOver(MARS);
    await settle();
}
