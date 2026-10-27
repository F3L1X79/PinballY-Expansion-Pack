// ============================================================
// Table ROMs tests' start without vpxtool: main.js on the fake host with the
// Profile picker as the Startup Screen, over a Household whose Admin
// Profiles the test names. A hurried player picks as soon as the carousel
// shows and closes the Welcome Screen; reads when the Error Toast arrives.
// Never loaded by PinballY.
// ============================================================

import { startOnProfilePicker, CAROUSEL_PAUSE_MS, GLIDE_OVER_MS } from "../core/startup_picker_scenario.js";
import { press, WELCOME_SCREEN_FADE_IN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import { watchCards } from "../achievements/error_toast_scenario.js";
import { fakeVpxtool, VPXTOOL, PROFILES_FOLDER } from "./table_roms_scenario.js";

// Well before the Add-on's 10 s startup delay.
const HURRIED_PICK_MS = 1000;
// Long enough for a toast to start once nothing holds it.
const ARRIVAL_LIMIT_MS = 5000;
const STEP_MS = 100;

// The carousel draws at the toasts' z-index too.
const isErrorCard = card => card.text.startsWith("PROBLEM | ");
const errorToastDrawn = fake => toastDrawings(fake).some(drawing => drawing.texts.includes("PROBLEM"));

// profiles: the Household; adminProfiles: those of them marked as Admin
// Profiles; activeProfile: the last active one, the carousel's first
// highlight; moves: the flipper presses ("Prev", "Next") to the Profile
// picked (Guest, then the Household in order); tableRoms: whether the Add-on is on;
// tables: the wheel's; vpxtool: the fake's answers, or none when it is
// missing. Returns whether an Error Toast was drawn before the Welcome
// Screen closed, the ms from that closing to its first draw (null when
// none within ARRIVAL_LIMIT_MS), and the Error Toasts shown after it.
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
    fake.advanceTime(CAROUSEL_PAUSE_MS + HURRIED_PICK_MS);
    await settle();
    for (const button of moves) {
        press(fake, button);
        fake.advanceTime(GLIDE_OVER_MS);
    }
    press(fake, "Select");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_FADE_IN_MS * 2);
    const drawnBeforeClosing = errorToastDrawn(fake);
    press(fake, "Exit");
    await settle();

    let arrivalMs = null;
    for (let elapsedMs = 0; elapsedMs <= ARRIVAL_LIMIT_MS && arrivalMs === null; elapsedMs += STEP_MS) {
        if (errorToastDrawn(fake)) arrivalMs = elapsedMs;
        else fake.advanceTime(STEP_MS);
    }
    return { fake, lang, store, drawnBeforeClosing, arrivalMs, errorCards: watchCards(fake).filter(isErrorCard) };
}
