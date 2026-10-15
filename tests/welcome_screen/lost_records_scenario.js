// ============================================================
// Lost Records tests' scenario: the High Scores scenario with the Welcome
// Screen and the Profile picker on, so a Profile arriving (at startup, or
// switched to as Change Player does) gets its Welcome Screen. Reads the
// Lost Records line the way the player sees it, and the seen markers in
// high_scores.json. Never loaded by PinballY.
// ============================================================

import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores } from "../high_scores/high_scores_scenario.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, lostRecordsLine, lostRecordsImages } from "./welcome_screen_reader.js";

// addOns: the Add-ons on besides the Welcome Screen and the Profile picker;
// the other options as startHighScores takes them. The startup Welcome
// Screen opens and is closed at once.
export async function startLostRecords({ addOns = ["highScores"], ...options } = {}) {
    const scenario = await startHighScores({ addOns: [...addOns, "startupChoicePrompt", "profilePicker"], ...options });
    const { fake } = scenario;
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    press(fake, "Exit");
    await settle();

    return {
        ...scenario,
        // Switches to the named Profile and lets its Welcome Screen open.
        arrive: async (name) => {
            scenario.switchTo(name);
            await settle();
            fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
        },
        isOpen: () => isWelcomeScreenOpen(fake),
        close: async () => {
            press(fake, "Exit");
            await settle();
        },
        // The Lost Records line, null when there is none.
        line: () => lostRecordsLine(fake),
        // The images drawn on the line: the taker's Avatar, if any.
        lineImages: () => lostRecordsImages(fake),
        // The seen markers by lower-case Profile name; undefined before any.
        seenMarkers: () => {
            const saved = scenario.saved();
            return saved && saved.lostRecordsSeen;
        },
    };
}
