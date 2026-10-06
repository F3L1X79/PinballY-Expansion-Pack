// ============================================================
// Checks all registered achievements for the active Profile at startup,
// after every "gamestarted" and "gameover" event, on every Profile
// switch and when the World Tour tracker, started here, completes a tour,
// and hands each newly unlocked one to the Achievement Toast
// module, which announces it with a card in the bottom-right corner once no
// game is running, with a Confetti Shower for a Platinum; an Achievement
// becomes Notified, for the Profile that unlocked it, when its toast starts. A Profile Reset forgets what was
// announced to that Profile and drops its toasts still waiting. When the
// toasts of a check bring a higher Player Level, one Level Toast for the
// highest level follows them; the level at startup, at a Profile switch
// and after a Profile Reset is the baseline, kept in memory, never announced.
// Also adds the Achievement List entry to the main menu, right after "Play",
// and the Profile Stats entry right after it. The Challenges family and the
// Profile Stats line on completed Challenges exist only while the
// Challenges Add-on is enabled. Also starts the Surprises tracker, which
// records each Play for the Surprises family.
// ============================================================

import { evaluateAchievements, markNotified, ACHIEVEMENT_RANK } from "../common/achievements.js";
import { buildDayManufacturersAchievements } from "../achievements/day_manufacturers.js";
import { buildManufacturerCompletionAchievements } from "../achievements/manufacturer_completion.js";
import { buildCollectionCompletionAchievements } from "../achievements/collection_completion.js";
import { buildPlayTimeTotalAchievements } from "../achievements/play_time_totals.js";
import { buildPeriodTableAchievements } from "../achievements/period_tables.js";
import { buildDecadeCompletionAchievements } from "../achievements/decade_completion.js";
import { buildCategoryCompletionAchievements } from "../achievements/category_completion.js";
import { buildSessionMilestoneAchievements } from "../achievements/session_milestones.js";
import { buildRandomGameFanAchievements } from "../achievements/random_game_fans.js";
import { buildChallengeAchievements } from "../achievements/challenges.js";
import { buildWorldTourAchievements } from "../achievements/world_tour.js";
import { createWorldTour } from "../common/world_tour.js";
import { buildSurprisesAchievements } from "../achievements/surprises.js";
import { createSurprises } from "../common/surprises.js";
import { getAchievementToasts, TOAST_KIND } from "../common/achievement_toast.js";
import { getPlayerLevel } from "../common/player_level.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/main_menu.js";
import { createAchievementList } from "../common/achievement_list.js";
import { createProfileStats } from "../common/profile_stats.js";
import { getDrawingAhead } from "../common/drawing_ahead.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/period_table.js";
import { createPinballYHost } from "../common/pinbally_host.js";
import { getProfileStore } from "../common/profile_store.js";
import { getChallenges } from "../common/challenge.js";
import config from "../common/config.js";
import lang from "../common/i18n.js";
import { safeHandler } from "../common/safe_handler.js";

const SCRIPT_NAME = "AchievementsEngine";
const ACHIEVEMENT_LIST_ENTRY = "achievementList";

// Null when the Challenges Add-on is disabled: then neither the Challenges
// family nor the Profile Stats line exists.
const getEnabledChallenges = () => (config.addOns.challenges === false ? null : getChallenges());

// Exported for the tests, which read each Achievement's rank.
export function getAllAchievements() {
    const challenges = getEnabledChallenges();
    return [
        ...buildDayManufacturersAchievements(),
        ...buildManufacturerCompletionAchievements(),
        ...buildCollectionCompletionAchievements(),
        ...buildWorldTourAchievements(),
        ...buildPlayTimeTotalAchievements(),
        ...buildPeriodTableAchievements(),
        ...buildDecadeCompletionAchievements(),
        ...buildCategoryCompletionAchievements(),
        ...buildSessionMilestoneAchievements(),
        ...buildRandomGameFanAchievements(),
        ...(challenges ? buildChallengeAchievements(challenges) : []),
        ...buildSurprisesAchievements(),
    ];
}

export default function init() {
    const achievementToasts = getAchievementToasts();
    const profileStore = getProfileStore();

    const achievementList = createAchievementList(createPinballYHost(), {
        getAchievements: getAllAchievements, profileStore, drawingAhead: getDrawingAhead(),
    });
    const mainMenu = getMainMenu();
    mainMenu.add({
        name: ACHIEVEMENT_LIST_ENTRY,
        label: lang.achievementList.menuEntry,
        position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST,
        // Exit goes back one level: the main menu, on this entry.
        action: () => achievementList.open(() => mainMenu.reopenOn(ACHIEVEMENT_LIST_ENTRY)),
    });
    const profileStats = createProfileStats(createPinballYHost(), {
        profileStore,
        achievementList,
        tableOfTheDay: getTableOfTheDay(),
        tableOfTheWeek: getTableOfTheWeek(),
        challenges: getEnabledChallenges(),
    });
    mainMenu.add({
        name: "profileStats",
        label: lang.profileStats.menuEntry,
        position: MAIN_MENU_POSITION.PROFILE_STATS,
        action: profileStats.open,
    });
    // Achievements handed to the Achievement Toast module, by Profile name
    // in lower case (Profile names ignore case). They are not Notified until
    // their toast starts, so later checks find the waiting ones again.
    const submittedIdsByProfile = new Map();
    // Profile Resets so far, by Profile name in lower case: a toast submitted
    // before its Profile's reset is stale.
    const resetCountByProfile = new Map();
    const resetCountOf = profileKey => resetCountByProfile.get(profileKey) || 0;
    // The Player Level each Profile is known to have, by Profile name in
    // lower case: announced, or the baseline.
    const knownLevelByProfile = new Map();

    // The level once every toast submitted so far has started.
    function levelOnceShown(achievements, submittedIds) {
        const ids = [...profileStore.getProfileData().notified, ...submittedIds];
        return getPlayerLevel(ids, achievements).level;
    }

    function submitLevelToast(profileKey, level, resetCount) {
        const TEXT = lang.playerLevel;
        achievementToasts.submit({
            kind: TOAST_KIND.LEVEL,
            tileNumber: level,
            title: TEXT.toastTitle(level),
            description: TEXT.toastDescription,
            onShown() {},
            isStale: () => resetCountOf(profileKey) !== resetCount,
        });
    }

    // isBaseline: the check at startup or at a Profile switch, whose level,
    // toasts included, is never announced.
    function checkForNewAchievements({ isBaseline = false } = {}) {
        // A toast may start after a switch: it is credited to the Profile
        // active when it was unlocked.
        const profileName = profileStore.getActiveProfile().name;
        const profileKey = profileName.toLowerCase();
        if (!submittedIdsByProfile.has(profileKey)) submittedIdsByProfile.set(profileKey, new Set());
        const submittedIds = submittedIdsByProfile.get(profileKey);
        const resetCount = resetCountOf(profileKey);
        const achievements = getAllAchievements();
        // Follows a drop (a gone Achievement, a lowered Rank), so a level
        // lost then won back is announced again.
        const levelBefore = levelOnceShown(achievements, submittedIds);
        const knownLevel = Math.min(knownLevelByProfile.get(profileKey) ?? levelBefore, levelBefore);
        evaluateAchievements(achievements, profileStore, (achievement) => {
            if (submittedIds.has(achievement.id)) return;
            submittedIds.add(achievement.id);
            achievementToasts.submit({
                title: achievement.getTitle(),
                description: achievement.getDescription(),
                rank: achievement.rank,
                celebrate: achievement.rank === ACHIEVEMENT_RANK.PLATINUM,
                onShown: () => markNotified(profileStore, profileName, achievement.id),
                isStale: () => resetCountOf(profileKey) !== resetCount,
            });
        });
        const levelAfter = levelOnceShown(achievements, submittedIds);
        if (levelAfter > knownLevel && !isBaseline) submitLevelToast(profileKey, levelAfter, resetCount);
        knownLevelByProfile.set(profileKey, Math.max(knownLevel, levelAfter));
    }

    // The timer callback runs outside the event handler's call stack, so it
    // needs its own guard.
    const safeCheckForNewAchievements = safeHandler(SCRIPT_NAME, () => checkForNewAchievements());
    const safeCheckBaseline = safeHandler(SCRIPT_NAME, () => checkForNewAchievements({ isBaseline: true }));

    // Fire on table launch and exit (the launch check catches the "grand
    // return" flag set at launch). Deferred by one tick so the stats trackers'
    // handlers for the same event run first.
    mainWindow.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        setTimeout(safeCheckForNewAchievements, 0);
    }));

    mainWindow.on("gameover", safeHandler(SCRIPT_NAME, () => {
        setTimeout(safeCheckForNewAchievements, 0);
    }));

    // Fires after any change of a Profile's data: a reset Profile starts
    // over, so its Achievements are announced again once unlocked again,
    // and its toasts still waiting never show.
    profileStore.onUpdate(safeHandler(SCRIPT_NAME, (profileName, { isReset }) => {
        if (!isReset) return;
        const profileKey = profileName.toLowerCase();
        submittedIdsByProfile.delete(profileKey);
        knownLevelByProfile.delete(profileKey);
        resetCountByProfile.set(profileKey, resetCountOf(profileKey) + 1);
    }));

    // Fires on every Profile switch: announces what the new Profile has
    // unlocked but was never announced (for example after an update); its
    // level, those toasts included, is the baseline.
    profileStore.onSwitch(safeCheckBaseline);

    // Checked right after the flag is set, so the World Tour's toast shows
    // on the wheel the moment the last table is selected.
    createWorldTour(createPinballYHost(), profileStore, { onCompleted: () => checkForNewAchievements() });
    // Its Play listener runs inside the "gameover" handlers, so the deferred
    // check above reads what it recorded.
    createSurprises(createPinballYHost(), profileStore);

    // Startup check, one tick after the inits, so a Welcome Screen submitted
    // at startup is already waiting whatever the order in main.js, and its
    // toasts wait for it.
    setTimeout(safeCheckBaseline, 0);
}
