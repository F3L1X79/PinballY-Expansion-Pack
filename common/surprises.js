// ============================================================
// Surprises tracker: records, in each Profile's profile.json "surprises"
// part, what the Surprises family's Secret Achievements need: flags, the
// seasons seen and the current One More Game! run. Listens to
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
// A Play started from FULL_MOON_NIGHT_FIRST_HOUR:00 to
// FULL_MOON_NIGHT_LAST_HOUR:59 the next morning, while the moon is at least
// FULL_MOON_MIN_LIT_PERCENT lit, earns Full Moon Night. That much light
// lasts about two days around the full moon, so it covers its night and
// sometimes the one before or after: about 24 nights a year.
export const FULL_MOON_NIGHT_FIRST_HOUR = 22;
export const FULL_MOON_NIGHT_LAST_HOUR = 5;
export const FULL_MOON_MIN_LIT_PERCENT = 99;
// The mean moon, worked out on the cabinet with no network: its age in the
// synodic month since a known new moon (6 January 2000, 18:14 UTC). The
// true moon drifts from it by some hours, well inside that window.
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);
const SYNODIC_MONTH_MS = 29.530588853 * 24 * 60 * 60 * 1000;
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
// ONE_MORE_GAME_PLAYS Plays in a row on the same table earn One More Game!.
// Only a Play on another table breaks the run.
export const ONE_MORE_GAME_PLAYS = 5;

export const surprisesOf = data => data.surprises || {};

// A window whose first hour comes after its last one runs past midnight.
const isInHours = (hour, firstHour, lastHour) => (firstHour <= lastHour
    ? hour >= firstHour && hour <= lastHour
    : hour >= firstHour || hour <= lastHour);

// The moon's lit fraction at that moment, from 0 (new) to 1 (full).
function moonLitFraction(date) {
    const age = (((date.getTime() - REFERENCE_NEW_MOON_MS) % SYNODIC_MONTH_MS) + SYNODIC_MONTH_MS) % SYNODIC_MONTH_MS;
    return (1 - Math.cos(2 * Math.PI * age / SYNODIC_MONTH_MS)) / 2;
}

// The flags a Play started at that moment earns.
function momentFlags(start) {
    const hour = start.getHours();
    const day = start.getDay();
    const flags = {};
    if (isInHours(hour, NIGHT_OWL_FIRST_HOUR, NIGHT_OWL_LAST_HOUR)) flags.nightOwl = true;
    if (isInHours(hour, FULL_MOON_NIGHT_FIRST_HOUR, FULL_MOON_NIGHT_LAST_HOUR)
        && moonLitFraction(start) * 100 >= FULL_MOON_MIN_LIT_PERCENT) flags.fullMoonNight = true;
    if (day === FRIDAY && start.getDate() === FRIDAY_THE_13TH_DATE) flags.fridayThe13th = true;
    if (day !== SATURDAY && day !== SUNDAY && isInHours(hour, LUNCH_BREAK_FIRST_HOUR, LUNCH_BREAK_LAST_HOUR)) {
        flags.lunchBreak = true;
    }
    // Hours only go up to 23, so this stops at 23:23.
    if (hour === start.getMinutes()) flags.mirrorHour = true;
    return flags;
}

export function createSurprises(profileStore) {
    // Fires after each Play is saved. Writes every time, since every Play
    // moves the One More Game! run.
    profileStore.onPlay(safeHandler(SCRIPT_NAME, ({ profileName, configId, start }) => {
        const flags = momentFlags(start);
        const season = SEASON_OF_MONTH[start.getMonth()];
        const surprises = surprisesOf(profileStore.getProfileDataOf(profileName));
        const seasons = surprises.seasons || [];
        const isNewSeason = !seasons.includes(season);
        const previousRun = surprises.oneMoreGameRun;
        const oneMoreGameRun = previousRun && previousRun.configId === configId
            ? { configId, count: previousRun.count + 1 }
            : { configId, count: 1 };
        if (oneMoreGameRun.count >= ONE_MORE_GAME_PLAYS) flags.oneMoreGame = true;
        profileStore.updateProfileData(data => {
            data.surprises = {
                ...surprisesOf(data), ...flags, seasons: isNewSeason ? [...seasons, season] : seasons, oneMoreGameRun,
            };
        }, profileName);
    }));
}
