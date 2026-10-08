// ============================================================
// Shown Player Level: the level the household has been shown, for each
// Profile (the baseline at startup, at a Profile switch and after a
// Profile Reset, then the level of each Level Toast as it starts), so the
// level pip never runs ahead of the Level Toast nor shows a drop out of
// nowhere. The Achievements engine is its only writer; listeners hear
// when the active Profile's shown level changes. No level while the
// Achievements Add-on is off. Nothing is persisted.
// ============================================================

import { getProfileStore } from "./profile_store.js";
import config from "./config.js";

export function createShownPlayerLevel({ profileStore, isEnabled = () => true }) {
    // By Profile name in lower case (Profile names ignore case).
    const levels = new Map();
    const listeners = [];
    const activeKey = () => profileStore.getActiveProfile().name.toLowerCase();

    return {
        // The active Profile's shown level, null when there is none.
        get: () => (isEnabled() ? levels.get(activeKey()) ?? null : null),
        set(profileName, level) {
            const key = profileName.toLowerCase();
            if (levels.get(key) === level) return;
            levels.set(key, level);
            if (key === activeKey()) for (const listener of listeners) listener();
        },
        onChange: listener => { listeners.push(listener); },
    };
}

let shared = null;

export function getShownPlayerLevel() {
    if (!shared) {
        shared = createShownPlayerLevel({ profileStore: getProfileStore(), isEnabled: () => config.addOns.achievements !== false });
    }
    return shared;
}
