// ============================================================
// Entry point loaded by PinballY: loads the Profile store, keeps the Adult
// Tables off a Child Profile's wheel, switches to Guest when the Profile
// picker is disabled, then initializes
// every project script listed in SCRIPTS, in order, skipping those disabled
// in config.addOns.
// A script whose init() throws is logged to logfile.log and skipped so the
// others still load; LOG_STARTUP_TIMING logs each init time.
// ============================================================

import config from "./common/config.js";
import { getProfileStore } from "./common/profile_store.js";
import { installChildWheelFilter } from "./common/adult_tables.js";

// Logs each script's init duration (ms), to help find a slow-starting script.
const LOG_STARTUP_TIMING = true;

import * as uiTranslation from "./addons/ui_translation.js";
import * as statusLineInfo from "./addons/status_line_info.js";
import * as customMenuCommands from "./addons/custom_menu_commands.js";
import * as customFilter from "./addons/custom_filter.js";
import * as hallOfFame from "./addons/hall_of_fame.js";
import * as tablesToDiscover from "./addons/tables_to_discover.js";
import * as menuCleanup from "./addons/menu_cleanup.js";
import * as profilePicker from "./addons/profile_picker.js";
import * as clock from "./addons/clock.js";
import * as seamlessLaunchOverlay from "./addons/seamless_launch_overlay.js";
import * as forceBackglass from "./addons/force_backglass.js";
import * as playLaunchSound from "./addons/play_launch_sound.js";
import * as sessionStatsTracker from "./addons/session_stats_tracker.js";
import * as achievementsEngine from "./addons/achievements_engine.js";
import * as challenges from "./addons/challenges.js";
import * as tableMastery from "./addons/table_mastery.js";
import * as ratingPrompt from "./addons/rating_prompt.js";
import * as welcomeScreen from "./addons/welcome_screen.js";

// Scripts are initialized in this order, which is also the order their event
// listeners are registered in, and listeners for the same event run in that
// order too:
// - uiTranslation must come first, so its "menuopen" hook is in place before
//   any menu opens.
// - sessionStatsTracker is kept before achievements as a safety margin; the
//   achievement checks after a game are deferred by one tick, so the stats
//   are recorded first either way (the startup check needs no stats from
//   this session).
// - profilePicker must come before the Welcome Screen, which offers
//   "Change Player" only when the picker registered itself at init.
// The other scripts don't depend on each other's order. In particular, the
// Welcome Screen and the rating prompt go through the wheel dialog module,
// which shows them in a fixed priority order, and Achievements are announced
// by non-blocking toasts, which wait for the Welcome Screen.
const SCRIPTS = [
    // Interface: translations, status line, menus, filters, menu cleanup,
    // Profile picker, clock, launch overlay.
    { key: "uiTranslation", module: uiTranslation },
    { key: "statusLineInfo", module: statusLineInfo },
    { key: "customMenuCommands", module: customMenuCommands },
    { key: "customFilter", module: customFilter },
    { key: "hallOfFame", module: hallOfFame },
    { key: "tablesToDiscover", module: tablesToDiscover },
    { key: "menuCleanup", module: menuCleanup },
    { key: "profilePicker", module: profilePicker },
    { key: "clock", module: clock },
    { key: "seamlessLaunchOverlay", module: seamlessLaunchOverlay },

    // Game session: windows, sound, stats, achievements, Challenges, Table
    // Mastery, rating.
    { key: "forceBackglass", module: forceBackglass },
    { key: "playLaunchSound", module: playLaunchSound },
    { key: "sessionStatsTracker", module: sessionStatsTracker },
    { key: "achievements", module: achievementsEngine },
    { key: "challenges", module: challenges },
    { key: "tableMastery", module: tableMastery },
    { key: "ratingPrompt", module: ratingPrompt },

    // Welcome Screen, under the startup prompt's former key, which owners'
    // env.local overrides still use.
    { key: "startupChoicePrompt", module: welcomeScreen },
];

const ENABLED_SCRIPTS = config.addOns;

// Before any Add-on, and whatever Add-ons are on: the store records every
// play, and its "gameover" listener must run before the Add-ons' own.
let store = null;
try {
    store = getProfileStore();
} catch (error) {
    logfile.log(`[Startup] ERROR loading the Profiles: ${error.message}`);
}

// Whatever Add-ons are on, a Child Profile never sees an Adult Table on the
// wheel. Before the switch to Guest below, which must refresh the wheel too.
if (store) {
    try {
        installChildWheelFilter();
    } catch (error) {
        logfile.log(`[Startup] ERROR installing the Child Profile's wheel filter: ${error.message}`);
    }
}

// Without the picker nothing could switch away from the saved Profile, so
// Guest takes over. Done before any Add-on subscribes to onSwitch, so no
// greeting or toast follows; only the Child Profile's wheel filter hears it.
if (store && ENABLED_SCRIPTS.profilePicker === false) {
    try {
        const previousProfile = store.getActiveProfile();
        if (!previousProfile.isGuest) {
            store.switchTo(store.listProfiles().find(profile => profile.isGuest).name);
            logfile.log(`[Startup] Profile picker disabled: switched from "${previousProfile.name}" to Guest.`);
        }
    } catch (error) {
        logfile.log(`[Startup] ERROR switching to Guest: ${error.message}`);
    }
}

for (const { key, module } of SCRIPTS) {
    if (ENABLED_SCRIPTS[key] === false) {
        if (LOG_STARTUP_TIMING) logfile.log(`[Startup] "${key}" skipped (disabled in config).`);
        continue;
    }

    const startTime = Date.now();
    try {
        module.default();
    } catch (error) {
        logfile.log(`[Startup] ERROR initializing "${key}": ${error.message}`);
        continue;
    }

    if (LOG_STARTUP_TIMING) {
        logfile.log(`[Startup] "${key}" initialized in ${Date.now() - startTime} ms.`);
    }
}