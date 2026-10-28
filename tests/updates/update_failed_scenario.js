// ============================================================
// Update result tests' start after a failed Pack Update: main.js on the fake
// host with the Profile picker as the Startup Screen, a Pack Update to
// v9.0.0 recorded, the check off unless asked. A hurried player picks as soon as the
// carousel shows and closes the Welcome Screen; reads the Error Toasts.
// Never loaded by PinballY.
// ============================================================

import { startOnProfilePicker, CAROUSEL_PAUSE_MS, GLIDE_OVER_MS } from "../core/startup_picker_scenario.js";
import { press, WELCOME_SCREEN_FADE_IN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { watchCards } from "../achievements/error_toast_scenario.js";

export const STATE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\pack_update.json";
const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// Well before any Add-on's startup delay.
const HURRIED_PICK_MS = 1000;

export const errorCardsOf = fake => watchCards(fake).filter(card => card.text.startsWith("PROBLEM | "));
export const requestedVersionOf = fake => JSON.parse(fake.readFile(STATE_FILE)).requestedVersion;

// adminProfiles: those of the Household (Alice, Bob) marked as Admin
// Profiles; activeProfile: the last active one; moves: the flipper presses
// to the Profile picked; updateCheck: the check's setting. Returns the
// Error Toasts shown after the Welcome Screen closed.
export async function pickAfterFailedUpdate({ adminProfiles = [], activeProfile = "Alice", moves = [], updateCheck = false } = {}) {
    const { fake, lang, store, settle } = await startOnProfilePicker({
        addOns: ["startupChoicePrompt", "profilePicker"],
        activeProfile,
        settings: { updateCheck },
        seed: f => {
            for (const name of adminProfiles) {
                f.addFile(`${PROFILES_FOLDER}\\${name}\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [], isAdmin: true }));
            }
            f.addFile(STATE_FILE, JSON.stringify({ version: 1, requestedVersion: "9.0.0", offeredVersion: "9.0.0" }));
        },
    });
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS + HURRIED_PICK_MS);
    await settle();
    for (const button of moves) {
        press(fake, button);
        fake.advanceTime(GLIDE_OVER_MS);
    }
    press(fake, "Select");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_FADE_IN_MS * 2);
    press(fake, "Exit");
    await settle();
    return { fake, lang, store, settle, errorCards: errorCardsOf(fake) };
}
