// ============================================================
// Shown Player Level: the level the household has been shown, per Profile,
// so the level pip never runs ahead of the Level Toast. Nothing is persisted.
// - The Achievements engine is its only writer.
// - No level while the Achievements Add-on is off.
// ============================================================

import { getProfileStore } from "../profiles/profile_store.js";
import config from "../core/config.js";

export function createShownPlayerLevel({ profileStore, isEnabled = () => true }) {
    // By Profile name in lower case (Profile names ignore case).
    const levels = new Map();
    const listeners = [];
    let readUnshown = null;
    const activeKey = () => profileStore.getActiveProfile().name.toLowerCase();

    return {
        // The active Profile's shown level, null when there is none.
        get: () => (isEnabled() ? levels.get(activeKey()) ?? null : null),
        // Any Profile's shown level, null when there is none.
        getOf(profileName) {
            if (!isEnabled()) return null;
            const key = profileName.toLowerCase();
            if (!levels.has(key) && readUnshown) levels.set(key, readUnshown(profileName));
            return levels.get(key) ?? null;
        },
        // read(profileName): the level of a Profile not shown yet.
        setUnshownReader: read => { readUnshown = read; },
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
