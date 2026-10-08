// ============================================================
// Player settings for the PinballY scripts in this project, with neutral
// defaults. Each player overrides them in a git-ignored .env.local in the
// pack's folder (copy .env.example), read synchronously at load time; the
// overridden keys and any invalid line are written to the PinballY log.
// Sound paths may be relative to the pack's folder.
// ============================================================

import { applyEnvOverrides } from "./env_overrides.js";
import { projectFolderOf } from "./pinbally_host.js";

const DEFAULTS = {
    // --- Set these for your setup ---

    // Interface language: "en", "fr", "de", "es", "it" or "pt".
    language: "en",
    // Sounds: a path relative to the pack's folder (such as
    // assets\sounds\local\launch.mp3, kept out of git) or an absolute one.
    // Empty = no sound.
    // Sound played when a table launches.
    launchSoundFile: "",
    // Sound played with each Achievement Toast.
    achievementSoundFile: "",
    // Sound played with each Profile Greeting.
    profileGreetingSoundFile: "",
    // Sound played once when a Confetti Shower starts.
    confettiSoundFile: "",
    // Sound played once when the Fireworks start.
    fireworksSoundFile: "",
    // Manufacturer name you gave fictional/community VPX tables in PinballY.
    // Used by the status line and the "Original Tables" filter.
    communityTablesManufacturer: "VPX Community",
    // PinballY category of the Adult Tables, which a Child Profile never sees (exact name).
    adultCategory: "NSFW",

    // --- Optional preferences ---

    // true = the random game jumps straight to the table, without the wheel animation.
    skipRandomGameAnimation: false,
    // Total play time (in minutes) on a table before you're asked to rate it.
    askToRateAfterMinutesPlayed: 60,
    // Seconds an Achievement Toast stays fully visible (above 0, at most 60).
    achievementToastSeconds: 4,
    // Size of an Achievement Toast: 1 = the original card, 2 = twice as large (from 0.5 to 3).
    achievementToastScale: 1.0,
    // false = no Confetti Shower with the toast of a completed Challenge or a
    // Platinum Achievement (nothing is drawn ahead for it, no sound plays),
    // for a PC that struggles with it.
    confetti: true,
    // false = no Fireworks with a Level Toast (nothing is drawn ahead for
    // them, no sound plays), for a PC that struggles with them.
    fireworks: true,
    // true = every PinballY menu title shown without a translation is written
    // to the PinballY log (for a new PinballY version or a new language).
    logUntranslatedMenuTitles: false,

    // --- Add-ons ---

    // Set any Add-on to false to keep it from starting. Menu Cleanup is the
    // only one off by default: it removes PinballY entries others may want.
    addOns: {
        uiTranslation: true,
        statusLineInfo: true,
        // The Welcome Screen, under the startup prompt's former key.
        startupChoicePrompt: true,
        forceBackglass: true,
        customMenuCommands: true,
        customFilter: true,
        hallOfFame: true,
        tablesToDiscover: true,
        sessionStatsTracker: true,
        achievements: true,
        seamlessLaunchOverlay: true,
        playLaunchSound: true,
        ratingPrompt: true,
        profilePicker: true,
        clock: true,
        wheelArc: true,
        challenges: true,
        tableMastery: true,
        menuCleanup: false,
    },
};

const LOG_PREFIX = "[Config]";
const ADODB_TEXT_TYPE = 2;
const ADODB_READ_ALL = -1;

const SOUND_FILE_KEYS = Object.keys(DEFAULTS).filter(key => key.endsWith("SoundFile"));
// A drive letter ("C:\\", "d:/"), a network path ("\\\\server\\share") or
// the root of the current drive ("\\sounds").
const ABSOLUTE_PATH_PATTERN = /^([A-Za-z]:|[\\/])/;

// The configuration with each non-empty, relative sound path made absolute
// from the pack's folder: Windows Media Player knows nothing of the pack.
export function resolveSoundFiles(config, projectFolder) {
    const resolved = { ...config };
    for (const key of SOUND_FILE_KEYS) {
        const path = resolved[key];
        if (typeof path !== "string" || path === "" || ABSOLUTE_PATH_PATTERN.test(path)) continue;
        resolved[key] = `${projectFolder}\\${path.replace(/\//g, "\\").replace(/^\.\\/, "")}`;
    }
    return resolved;
}

// Returns the text of the .env.local at that path, or null when there is none.
// Read through COM (not an async API) because modules read the configuration
// while they load; ADODB.Stream decodes UTF-8, so accented paths survive.
function readEnvLocal(path) {
    const fileSystem = createAutomationObject("Scripting.FileSystemObject");
    if (!fileSystem.FileExists(path)) return null;

    const stream = createAutomationObject("ADODB.Stream");
    stream.Type = ADODB_TEXT_TYPE;
    stream.Charset = "utf-8";
    stream.Open();
    try {
        stream.LoadFromFile(path);
        return stream.ReadText(ADODB_READ_ALL);
    } finally {
        stream.Close();
    }
}

function loadConfig() {
    // Under Node (tests) there is no COM: the defaults apply.
    if (typeof createAutomationObject !== "function") return DEFAULTS;

    const projectFolder = projectFolderOf(systemInfo.programDir);
    const path = `${projectFolder}\\.env.local`;
    let text;
    try {
        text = readEnvLocal(path);
    } catch (error) {
        logfile.log(`${LOG_PREFIX} ERROR reading ${path}, using defaults: ${error.message}`);
        return resolveSoundFiles(DEFAULTS, projectFolder);
    }
    if (text === null) {
        logfile.log(`${LOG_PREFIX} No .env.local found at ${path}; using defaults.`);
        return resolveSoundFiles(DEFAULTS, projectFolder);
    }

    const { config, overridden, problems } = applyEnvOverrides(DEFAULTS, text);
    logfile.log(`${LOG_PREFIX} .env.local overrides: ${overridden.length > 0 ? overridden.join(", ") : "none"}.`);
    for (const problem of problems) {
        logfile.log(`${LOG_PREFIX} .env.local ${problem}; ignored.`);
    }
    return resolveSoundFiles(config, projectFolder);
}

export default loadConfig();
