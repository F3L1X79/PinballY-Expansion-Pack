// ============================================================
// Daily Streak: a Profile's days in a row on the cabinet (the active
// Profile's by default), read from its Play Log (every year file) whenever it is asked, so nothing is
// persisted and a Profile Reset, which sets the Play Log aside, brings it
// back to 0, its longest too. A day counts when a Play started on it; the
// day key changes at midnight, as the Table of the Day's. Created from the
// PinballY host (for the time) and the Profile store; the Add-ons share one
// instance through getDailyStreak(). No event, no side effect.
// ============================================================

import { createPinballYHost } from "./pinbally_host.js";
import { getProfileStore } from "./profile_store.js";
import { formatDateKey, shiftDateKey } from "./period_table.js";

const dayBefore = date => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);

// The longest run of consecutive days, across month and year ends: the
// day keys sort as dates.
function longestRun(days) {
    let longest = 0;
    let length = 0;
    let previous = null;
    for (const day of [...days].sort()) {
        length = previous !== null && shiftDateKey(day, -1) === previous ? length + 1 : 1;
        longest = Math.max(longest, length);
        previous = day;
    }
    return longest;
}

export function createDailyStreak(host, store) {
    // The day keys of the named Profile's Plays: a Play Log start is local
    // time, "2026-10-07T21:10:00", whose date part is the day key.
    function playedDays(name) {
        const days = new Set();
        for (const year of store.getPlayLogYearsOf(name)) {
            for (const play of store.getPlayLogOf(name, year)) days.add(String(play.start).slice(0, 10));
        }
        return days;
    }

    // { current, longest, isTodayCounted }: current counts back from today when it
    // counts, else from yesterday, so the Daily Streak stays alive all day.
    function read(profileName = store.getActiveProfile().name) {
        const days = playedDays(profileName);
        const today = host.now();
        const isTodayCounted = days.has(formatDateKey(today));
        let current = 0;
        for (let day = isTodayCounted ? today : dayBefore(today); days.has(formatDateKey(day)); day = dayBefore(day)) current++;
        return { current, longest: longestRun(days), isTodayCounted };
    }

    return { read };
}

let sharedDailyStreak = null;

export function getDailyStreak() {
    if (!sharedDailyStreak) sharedDailyStreak = createDailyStreak(createPinballYHost(), getProfileStore());
    return sharedDailyStreak;
}
