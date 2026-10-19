// ============================================================
// Session Achievements: "marathon", the Secret "rage quit" and "grand
// return", and the Daily Streak ladder (3 to 30 days in a row). Reads the
// session stats recorded by session_stats_tracker.js and the Daily Streak.
// Writes nothing.
// - A Daily Streak Achievement is unlocked by the longest streak: a broken one never takes it back.
// ============================================================

import { ACHIEVEMENT_FAMILY, ACHIEVEMENT_RANK, countedAchievement, PROGRESS_UNIT, standaloneAchievement } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { getDailyStreak } from "../common/achievements/daily_streak.js";
import {
    RAGE_QUIT_MIN_SECONDS,
    RAGE_QUIT_MAX_SECONDS,
    GRAND_RETURN_THRESHOLD_DAYS,
} from "../addons/session_stats_tracker.js";

// Each marathon or Daily Streak value is part of an Achievement ID:
// changing one would announce the Achievement again to players who already
// earned it. Each one also needs its title in every lang/ file.
const MARATHON_THRESHOLDS_MINUTES = [30, 60];
const DAILY_STREAK_THRESHOLDS_DAYS = [3, 7, 15, 30];

const activeSessions = () => getProfileStore().getProfileData().sessions;

export function buildSessionMilestoneAchievements() {
    const { achievements: TEXT } = lang;

    // Rounded down: it reaches a whole number of minutes exactly when the
    // seconds do.
    const longestMinutes = () => Math.floor(activeSessions().longestSeconds / 60);

    const achievements = MARATHON_THRESHOLDS_MINUTES.map(minutes => countedAchievement({
        id: `marathon:${minutes}`,
        family: ACHIEVEMENT_FAMILY.SESSIONS,
        getTitle: () => TEXT.marathonTitles[minutes],
        getDescription: () => TEXT.marathonDescription(minutes),
        target: minutes,
        ladder: MARATHON_THRESHOLDS_MINUTES,
        unit: PROGRESS_UNIT.MINUTES,
        getCurrent: longestMinutes,
    }));

    achievements.push(standaloneAchievement({
        id: "rageQuit",
        family: ACHIEVEMENT_FAMILY.SESSIONS,
        // It happens in a moment, often by accident.
        rank: ACHIEVEMENT_RANK.BRONZE,
        getTitle: () => TEXT.rageQuitTitle(),
        getDescription: () => TEXT.rageQuitDescription(RAGE_QUIT_MIN_SECONDS, RAGE_QUIT_MAX_SECONDS),
        getHint: () => TEXT.rageQuitHint(),
        checkUnlocked: () => activeSessions().rageQuit,
    }));

    achievements.push(standaloneAchievement({
        id: "grandReturn",
        family: ACHIEVEMENT_FAMILY.SESSIONS,
        // It takes patience, no skill.
        rank: ACHIEVEMENT_RANK.SILVER,
        getTitle: () => TEXT.grandReturnTitle(),
        getDescription: () => TEXT.grandReturnDescription(GRAND_RETURN_THRESHOLD_DAYS),
        getHint: () => TEXT.grandReturnHint(),
        checkUnlocked: () => activeSessions().grandReturn,
    }));

    const dailyStreak = getDailyStreak();
    for (const days of DAILY_STREAK_THRESHOLDS_DAYS) {
        achievements.push(countedAchievement({
            id: `cabinetStreak:${days}`,
            family: ACHIEVEMENT_FAMILY.SESSIONS,
            getTitle: () => TEXT.cabinetStreakTitles[days],
            getDescription: () => TEXT.cabinetStreakDescription(days),
            target: days,
            ladder: DAILY_STREAK_THRESHOLDS_DAYS,
            unit: PROGRESS_UNIT.DAYS_IN_A_ROW,
            getCurrent: () => dailyStreak.read().current,
            getRecord: () => dailyStreak.read().longest,
        }));
    }

    return achievements;
}