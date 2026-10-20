// ============================================================
// Starts main.js on the fake host with the Profile picker as the Startup
// Screen, and reads its carousel as the player sees it. Never loaded by
// PinballY; one start per test file, as main.js loads once per process.
// ============================================================

import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// The carousel's background, its Avatars, then the gold frame and names.
const PICKER_Z_RANGE = [6500, 6502];

// The startup pause before the carousel shows, and the glide between two Avatars.
export const CAROUSEL_PAUSE_MS = 500;
export const GLIDE_OVER_MS = 500;

// addOns: the Add-ons turned on; profiles: the Household's folders;
// tables: the wheel's, as the fake host takes them.
export async function startOnProfilePicker({
    addOns = ["startupChoicePrompt", "profilePicker"], profiles = ["Alice", "Bob"], activeProfile = "Bob", tables,
} = {}) {
    const fake = createFakePinballYHost(tables ? { tables } : {});
    for (const name of profiles) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = addOns.includes(key);
    config.language = "en";
    config.startupScreen = "profilePicker";

    const { default: lang } = await import("../../common/core/i18n.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    const { getAchievementToasts } = await import("../../common/achievements/achievement_toast.js");
    await import("../../main.js");
    return { fake, lang, store: getProfileStore(), toasts: getAchievementToasts(), settle };
}

// What the picker's layers show now, the toasts' drawings left out.
export const pickerTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex >= PICKER_Z_RANGE[0] && layer.zIndex <= PICKER_Z_RANGE[1] && layer.alpha > 0)
    .flatMap(layer => layer.texts());

// Whether the carousel shows: its title on screen.
export const isCarouselOpen = (fake, lang) => pickerTexts(fake).includes(lang.profiles.pickerTitle);

// The one Profile name shown (only the highlighted Avatar is named).
export function highlightedName(fake, names) {
    const shown = names.filter(name => pickerTexts(fake).includes(name));
    assert.equal(shown.length, 1, `exactly one name among ${names.join(", ")} is shown`);
    return shown[0];
}
