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

export const surprisesOf = data => data.surprises || {};

export function createSurprises(profileStore) {
    // Fires after each Play is saved.
    profileStore.onPlay(safeHandler(SCRIPT_NAME, ({ profileName, start }) => {
        const hour = start.getHours();
        if (hour < NIGHT_OWL_FIRST_HOUR || hour > NIGHT_OWL_LAST_HOUR) return;
        profileStore.updateProfileData(data => {
            data.surprises = { ...surprisesOf(data), nightOwl: true };
        }, profileName);
    }));
}
