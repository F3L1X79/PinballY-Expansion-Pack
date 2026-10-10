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
// Once given a way to open the frame list (enablePrompts), submits the
// Reward Prompt through the wheel dialog module for a Profile with a frame
// unlocked and no "avatarFrame" key yet: at startup and on each Profile
// switch, and after the Mastery Toast that announces a first frame. The
// prompt sets the key to null when it shows, so it never comes back short
// of a Profile Reset.
// ============================================================

import { createPinballYHost } from "./pinbally_host.js";
import { getProfileStore } from "./profile_store.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "./wheel_dialog.js";
import { safeHandler } from "./safe_handler.js";
import lang from "./i18n.js";
import config from "./config.js";

const FRAME_COUNT = 10;
// Frames drawn this wide or less take the 192 px image, wider ones the 384 px one.
const SMALL_IMAGE_MAX_WIDTH = 192;
const FRAMES_FOLDER = "assets\\images\\avatar_frames";
const SCRIPT_NAME = "ProfileRewards";
const REWARD_PROMPT_ID = "rewardPrompt";

export function createProfileRewards(host, { profileStore, isEnabled = () => true, wheelDialogs = null }) {
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

    // Opens the frame list on that tier's row, then calls onClosed once it
    // closes; null until enablePrompts.
    let openFrameList = null;
    // Profile Resets so far, by Profile name in lower case (Profile names
    // ignore case): a prompt submitted before its Profile's reset is stale.
    const resetCounts = new Map();
    const resetCountOf = profileKey => resetCounts.get(profileKey) || 0;

    const isPromptPending = profileName => openFrameList !== null
        && !("avatarFrame" in dataOf(profileName)) && framesOf(profileName).some(frame => frame.isUnlocked);

    // The Reward Prompt for the named Profile, dropped when that Profile is
    // reset, no longer active or already prompted at its turn; isBlocked
    // (optional) also drops it, isReady (optional) holds it.
    function submitPrompt(profileName, { isBlocked = () => false, isReady } = {}) {
        if (!isPromptPending(profileName)) return;
        const profileKey = profileName.toLowerCase();
        const resetCount = resetCountOf(profileKey);
        // The newest frame: the one just won.
        const frame = framesOf(profileName).filter(candidate => candidate.isUnlocked).pop();
        const TEXT = lang.profileRewards.prompt;
        wheelDialogs.submit({
            id: REWARD_PROMPT_ID,
            message: TEXT.message(frame.name, lang.profileStats.menuEntry, lang.profileStats.buttons.frame),
            buttons: [
                // A drawn dialog of its own once the prompt closed: the queue
                // waits for the frame list, so no dialog opens over it.
                { label: TEXT.goEquip, action: () => wheelDialogs.submit({ priority: DIALOG_PRIORITY.REWARD_PROMPT, open: close => openFrameList(frame.tier, close) }) },
                // No action: the dialog closing is all it must do.
                { label: TEXT.gotIt },
            ],
            priority: DIALOG_PRIORITY.REWARD_PROMPT,
            isReady,
            isStale: () => isBlocked() || resetCountOf(profileKey) !== resetCount
                || profileStore.getActiveProfile().name.toLowerCase() !== profileKey || !isPromptPending(profileName),
            onShown: safeHandler(SCRIPT_NAME, () => profileStore.updateProfileData(data => { data.avatarFrame = null; }, profileName)),
        });
    }

    const submitForActive = () => submitPrompt(profileStore.getActiveProfile().name);

    return {
        framesOf,
        wornFrameOf,
        // The image of the frame the Profile wears, for a frame drawn
        // frameWidth pixels wide; null when it wears none or the file is missing.
        wornImageOf(profileName, frameWidth) {
            const frame = wornFrameOf(profileName);
            return frame ? existingImage(frame.images[frameWidth <= SMALL_IMAGE_MAX_WIDTH ? "small" : "large"]) : null;
        },
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
        // opener(tier, onClosed): opens the frame list on that tier's row,
        // calling onClosed once the list is closed. Submits the
        // active Profile's pending prompt now, which waits for the Welcome
        // Screen, and the new one's on each Profile switch.
        enablePrompts(opener) {
            openFrameList = opener;
            profileStore.onUpdate(safeHandler(SCRIPT_NAME, (profileName, { isReset }) => {
                if (isReset) resetCounts.set(profileName.toLowerCase(), resetCountOf(profileName.toLowerCase()) + 1);
            }));
            profileStore.onSwitch(safeHandler(SCRIPT_NAME, submitForActive));
            submitForActive();
        },
        // For the Mastery Toast of a Collection Tier that unlocks frames,
        // isStale being the toast's: submits the Profile's pending prompt
        // now, so it holds its place ahead of the rating prompt, and returns
        // the toast's onShown, which lets it show. A stale toast never shows,
        // so neither does its prompt.
        promptAfterToast(profileName, isStale) {
            let isToastShown = false;
            submitPrompt(profileName, { isBlocked: isStale, isReady: () => isToastShown });
            return () => {
                isToastShown = true;
                wheelDialogs.wake();
            };
        },
    };
}

let shared = null;

export function getProfileRewards() {
    if (!shared) {
        shared = createProfileRewards(createPinballYHost(), {
            profileStore: getProfileStore(), isEnabled: () => config.addOns.tableMastery !== false, wheelDialogs: getWheelDialogs(),
        });
    }
    return shared;
}
