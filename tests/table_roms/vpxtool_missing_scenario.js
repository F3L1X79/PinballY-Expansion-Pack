// ============================================================
// Table ROMs tests' start without vpxtool: main.js on the fake host with the
// Profile picker as the Startup Screen, over a Household whose Admin
// Profiles the test names. Picks the last active Profile once the Add-on's
// startup check ran, closes the Welcome Screen and watches the cards after.
// Never loaded by PinballY.
// ============================================================

import { startOnProfilePicker, CAROUSEL_PAUSE_MS, GLIDE_OVER_MS } from "../core/startup_picker_scenario.js";
import { press, WELCOME_SCREEN_FADE_IN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { watchCards } from "../achievements/error_toast_scenario.js";
import { fakeVpxtool, VPXTOOL, PROFILES_FOLDER } from "./table_roms_scenario.js";
// Past the Add-on's 10 s startup delay, the carousel still open.
const PAST_STARTUP_CHECK_MS = 15000;

// The carousel draws at the toasts' z-index too.
const isErrorCard = card => card.text.startsWith("PROBLEM | ");

// profiles: the Household; adminProfiles: those of them marked as Admin
// Profiles; activeProfile: the last active one, the carousel's first
// highlight; moves: the flipper presses ("Prev", "Next") to the Profile
// picked (Guest, then the Household in order); tableRoms: whether the Add-on is on;
// tables: the wheel's; vpxtool: the fake's answers, or none when it is
// missing. Returns the Error Toasts shown while the carousel was open and
// those after the Welcome Screen.
export async function pickAtStartup({
    profiles = ["Alice", "Bob"], adminProfiles = [], activeProfile, moves = [], tableRoms = true, tables, vpxtool,
}) {
    const addOns = ["startupChoicePrompt", "profilePicker", ...(tableRoms ? ["tableRoms"] : [])];
    const { fake, lang, store, settle } = await startOnProfilePicker({
        addOns, profiles, activeProfile, tables,
        seed: f => {
            for (const name of adminProfiles) {
                f.addFile(`${PROFILES_FOLDER}\\${name}\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [], isAdmin: true }));
            }
            for (const game of tables || []) f.addFile(game.gameFile, "script");
            if (vpxtool) f.addProgram(VPXTOOL, fakeVpxtool(vpxtool));
        },
    });
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS + PAST_STARTUP_CHECK_MS);
    await settle();
    const errorCardsWhilePicking = watchCards(fake).filter(isErrorCard);

    for (const button of moves) {
        press(fake, button);
        fake.advanceTime(GLIDE_OVER_MS);
    }
    press(fake, "Select");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_FADE_IN_MS * 2);
    press(fake, "Exit");
    await settle();
    return { fake, lang, store, errorCardsWhilePicking, errorCards: watchCards(fake).filter(isErrorCard) };
}
