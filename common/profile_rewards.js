// ============================================================
// Profile Rewards: the only module that knows the Avatar Frames, one per
// Collection Tier from 1 to 10, unlocked by reaching that tier. Unlocking
// is worked out afresh every time and never stored. No frames while the
// Table Mastery Add-on is off, since no Collection Tier is kept then.
// Writes nothing.
// ============================================================

import { createPinballYHost } from "./pinbally_host.js";
import lang from "./i18n.js";
import config from "./config.js";

const FRAME_COUNT = 10;
const FRAMES_FOLDER = "assets\\images\\avatar_frames";

export function createProfileRewards(host, { isEnabled = () => true } = {}) {
    const projectFolder = host.getProjectFolder();

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

    return {
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
        shared = createProfileRewards(createPinballYHost(), { isEnabled: () => config.addOns.tableMastery !== false });
    }
    return shared;
}
