// ============================================================
// Play Error Toasts: a Play the Profile Store could not save, or not keep in
// the Play Log, brings an Error Toast under the table's name, for the
// Profile that played. Started by main.js whatever Add-ons are on.
// - Kept out of the Profile Store, which loads before the language is known.
// ============================================================

import lang from "../core/i18n.js";
import { safeHandler } from "../core/safe_handler.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { getProfileStore } from "../profiles/profile_store.js";
import { getAchievementToasts, TOAST_KIND } from "./achievement_toast.js";

const SCRIPT_NAME = "PlayErrorToasts";

export function startPlayErrorToasts() {
    const host = createPinballYHost();
    const profileStore = getProfileStore();
    // Fires after a Play's failed write, past its other listeners.
    profileStore.onPlayFailed(safeHandler(SCRIPT_NAME, ({ profileName, configId, isCounted }) => {
        const table = host.getGameInfo(configId);
        const profileKey = profileName.toLowerCase();
        // Created at the first failure: the toasts need no layer before.
        getAchievementToasts().submit({
            kind: TOAST_KIND.ERROR,
            title: table ? table.title : configId,
            description: isCounted ? lang.errorToast.playNotInPlayLog : lang.errorToast.playNotSaved,
            onShown() {},
            // Told to the Profile that played only.
            isStale: () => profileStore.getActiveProfile().name.toLowerCase() !== profileKey,
        });
    }));
}
