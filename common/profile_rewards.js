// ============================================================
// Profile Rewards: the only module that knows the Avatar Frames, one per
// Collection Tier from 1 to 10, unlocked by reaching the Collection Tier
// kept in profile.json ("collectionTier"), never the one computed from the
// tables, so a frame never locks again short of a Profile Reset. Unlocking
// is worked out afresh every time and never stored. No frames while the
// Table Mastery Add-on is off, since no Collection Tier is kept then.
// Writes only the active Profile's choice ("avatarFrame": the worn frame's
// tier, or null for none), through the Profile store. A missing frame
// image is logged once and read as none.
// ============================================================

import { createPinballYHost } from "./pinbally_host.js";
import { getProfileStore } from "./profile_store.js";
import lang from "./i18n.js";
import config from "./config.js";

const FRAME_COUNT = 10;
const FRAMES_FOLDER = "assets\\images\\avatar_frames";
const SCRIPT_NAME = "ProfileRewards";

export function createProfileRewards(host, { profileStore, isEnabled = () => true }) {
    const projectFolder = host.getProjectFolder();
    // Each image's path, or null when its file is missing: checked once per session.
    const imagePaths = new Map();

    function existingImage(path) {
        if (!imagePaths.has(path)) {
            const exists = host.files.fileExists(path);
            if (!exists) host.log(`[${SCRIPT_NAME}] Avatar Frame image not found, showing the plain Avatar: ${path}`);
            imagePaths.set(path, exists ? path : null);
        }
        return imagePaths.get(path);
    }

    // tier: from 1 to FRAME_COUNT. The images are drawn by absolute path:
    // drawImage resolves relative paths from the PinballY folder.
    function frameOf(tier) {
        const base = `${projectFolder}\\${FRAMES_FOLDER}\\frame_${String(tier).padStart(2, "0")}`;
        return {
            tier,
            name: lang.profileRewards.frameNames[tier - 1],
            images: { large: `${base}_384.png`, small: `${base}_192.png`, locked: `${base}_192_locked.png` },
        };
    }

    const dataOf = profileName => (profileName === undefined ? profileStore.getProfileData() : profileStore.getProfileDataOf(profileName));

    // Every frame of the Profile (the active one by default) in tier
    // order, each with whether it is unlocked; none with the Add-on off.
    function framesOf(profileName) {
        if (!isEnabled()) return [];
        const keptTier = dataOf(profileName).collectionTier || 0;
        return Array.from({ length: FRAME_COUNT }, (_, index) => ({ ...frameOf(index + 1), isUnlocked: keptTier >= index + 1 }));
    }

    const unlockedFrameOf = (tier, profileName) => framesOf(profileName).find(frame => frame.isUnlocked && frame.tier === tier) || null;

    // The frame the Profile wears, null when none: a choice of a frame
    // that is not unlocked (a hand edit) wears none.
    const wornFrameOf = profileName => unlockedFrameOf(dataOf(profileName).avatarFrame, profileName);

    return {
        framesOf,
        wornFrameOf,
        // The image of that size ("large", "small" or "locked") of a frame
        // from framesOf, null when its file is missing.
        imageOf: (frame, size) => existingImage(frame.images[size]),
        // Makes the active Profile wear the frame of that tier, or none for
        // null; false, changing nothing, when that frame is not unlocked.
        choose(tier) {
            if (tier !== null && !unlockedFrameOf(tier)) return false;
            profileStore.updateProfileData(data => { data.avatarFrame = tier; });
            return true;
        },
        // The frames a Collection Tier raised from keptTier to tier unlocks,
        // lowest first: none when it unlocks none.
        framesUnlockedBetween(keptTier, tier) {
            if (!isEnabled()) return [];
            const frames = [];
            for (let frameTier = Math.max(1, keptTier + 1); frameTier <= Math.min(tier, FRAME_COUNT); frameTier++) {
                frames.push(frameOf(frameTier));
            }
            return frames;
        },
    };
}

let shared = null;

export function getProfileRewards() {
    if (!shared) {
        shared = createProfileRewards(createPinballYHost(), {
            profileStore: getProfileStore(), isEnabled: () => config.addOns.tableMastery !== false,
        });
    }
    return shared;
}
