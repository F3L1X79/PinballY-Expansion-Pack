// ============================================================
// Surprises tracker: records, in each Profile's profile.json "surprises"
// part, what the Surprises family's Secret Achievements need. Listens to
// the Profile store's Play announcement (ADR 0008) and writes for the
// Profile active when the Play started; only Plays made since the update
// count, the Play Log is never replayed. A missing "surprises" part reads
// as empty; a Profile Reset erases it with the rest.
// ============================================================

import { safeHandler } from "./safe_handler.js";

const SCRIPT_NAME = "Surprises";

// A Play started from NIGHT_OWL_FIRST_HOUR:00 to NIGHT_OWL_LAST_HOUR:59
// earns Night Owl.
export const NIGHT_OWL_FIRST_HOUR = 0;
export const NIGHT_OWL_LAST_HOUR = 3;
// Same for Lunch Break, Monday to Friday; public holidays are not known.
export const LUNCH_BREAK_FIRST_HOUR = 12;
export const LUNCH_BREAK_LAST_HOUR = 13;
const FRIDAY = 5;
const SATURDAY = 6;
const SUNDAY = 0;
const FRIDAY_THE_13TH_DATE = 13;
// Meteorological seasons, by whole months and with no notion of
// hemisphere, indexed by the month counted from 0 (December is winter).
const SEASON_OF_MONTH = [
    "winter", "winter", "spring", "spring", "spring", "summer",
    "summer", "summer", "autumn", "autumn", "autumn", "winter",
];
export const SEASON_COUNT = new Set(SEASON_OF_MONTH).size;

export const surprisesOf = data => data.surprises || {};

const isInHours = (hour, firstHour, lastHour) => hour >= firstHour && hour <= lastHour;

// The flags a Play started at that moment earns.
function momentFlags(start) {
    const hour = start.getHours();
    const day = start.getDay();
    const flags = {};
    if (isInHours(hour, NIGHT_OWL_FIRST_HOUR, NIGHT_OWL_LAST_HOUR)) flags.nightOwl = true;
    if (day === FRIDAY && start.getDate() === FRIDAY_THE_13TH_DATE) flags.fridayThe13th = true;
    if (day !== SATURDAY && day !== SUNDAY && isInHours(hour, LUNCH_BREAK_FIRST_HOUR, LUNCH_BREAK_LAST_HOUR)) {
        flags.lunchBreak = true;
    }
    // Hours only go up to 23, so this stops at 23:23.
    if (hour === start.getMinutes()) flags.mirrorHour = true;
    return flags;
}

export function createSurprises(profileStore) {
    // Fires after each Play is saved.
    profileStore.onPlay(safeHandler(SCRIPT_NAME, ({ profileName, start }) => {
        const flags = momentFlags(start);
        const season = SEASON_OF_MONTH[start.getMonth()];
        const surprises = surprisesOf(profileStore.getProfileDataOf(profileName));
        const seasons = surprises.seasons || [];
        const isNewSeason = !seasons.includes(season);
        const isNewFlag = Object.keys(flags).some(flag => surprises[flag] !== true);
        if (!isNewSeason && !isNewFlag) return;
        profileStore.updateProfileData(data => {
            data.surprises = { ...surprisesOf(data), ...flags, seasons: isNewSeason ? [...seasons, season] : seasons };
        }, profileName);
    }));
}
