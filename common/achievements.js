// ============================================================
// Generic achievement evaluation. An achievement is a plain object:
//   { id, family, rank, getTitle(), getDescription(), checkUnlocked(), getProgress(), getHint() }
// where family is one of ACHIEVEMENT_FAMILY, rank its Achievement Rank (one
// of ACHIEVEMENT_RANK) and the optional getProgress() returns its
// Achievement Progress, { current, target, unit } with unit one of
// PROGRESS_UNIT, or null. The optional getHint() makes it a Secret
// Achievement: the Achievement List shows "???" and the hint while it is
// missing. countedAchievement() builds the unlock and the Achievement
// Progress from one value (or from a value and its record, for a Streak)
// and deduces the rank; standaloneAchievement() builds one that stands
// alone, Gold unless its definition states a rank. The rank is never
// persisted nor part of an ID.
// "Unlocked" is computed live from the active Profile's progress; only the
// fact that a Profile was Notified is persisted (its profile.json
// "notified" list), so each Achievement is announced once per Profile.
// The caller marks an achievement Notified when its toast starts.
// ============================================================

// The kind of an Achievement; the Challenges one exists only while its
// Add-on is enabled, Surprises whenever the Achievements do.
export const ACHIEVEMENT_FAMILY = Object.freeze({
    COLLECTION: "collection",
    PLAY_TIME: "playTime",
    PERIOD_TABLES: "periodTables",
    SESSIONS: "sessions",
    RANDOM_GAME: "randomGame",
    MANUFACTURERS: "manufacturers",
    DECADES: "decades",
    CATEGORIES: "categories",
    CHALLENGES: "challenges",
    SURPRISES: "surprises",
});

// What an Achievement Progress counts; each one has its texts in the
// Achievement List's progressUnits of every lang/ file.
export const PROGRESS_UNIT = Object.freeze({
    TABLES: "tables",
    HOURS: "hours",
    DAYS_IN_A_ROW: "daysInARow",
    WEEKS_IN_A_ROW: "weeksInARow",
    DAYS_PLAYED: "daysPlayed",
    WEEKS_PLAYED: "weeksPlayed",
    MINUTES: "minutes",
    RANDOM_GAMES: "randomGames",
    MANUFACTURERS: "manufacturers",
    CHALLENGES: "challenges",
});

// Every Achievement's Achievement Rank, from the easiest.
export const ACHIEVEMENT_RANK = Object.freeze({
    BRONZE: "bronze",
    SILVER: "silver",
    GOLD: "gold",
    PLATINUM: "platinum",
});
export const RANKS_IN_ORDER = Object.freeze(Object.values(ACHIEVEMENT_RANK));

// A group completion's rank from the size of its group: up to each limit,
// that rank; above the last one, Platinum.
const GROUP_COMPLETION_RANK_LIMITS = [
    { maxTables: 3, rank: ACHIEVEMENT_RANK.BRONZE },
    { maxTables: 10, rank: ACHIEVEMENT_RANK.SILVER },
    { maxTables: 25, rank: ACHIEVEMENT_RANK.GOLD },
];

// A ladder is a series of Achievements that only differ by their threshold:
// its first step is always Bronze, its last always Platinum, the others
// spread in between. A single step is no ladder: it is Gold, like a
// standalone Achievement.
function ladderRank(ladder, step) {
    const position = ladder.indexOf(step);
    if (position === -1) throw new Error(`"${step}" is not a step of its ladder`);
    if (ladder.length === 1) return ACHIEVEMENT_RANK.GOLD;
    return RANKS_IN_ORDER[Math.round(position * (RANKS_IN_ORDER.length - 1) / (ladder.length - 1))];
}

function groupCompletionRank(tableCount) {
    const limit = GROUP_COMPLETION_RANK_LIMITS.find(({ maxTables }) => tableCount <= maxTables);
    return limit ? limit.rank : ACHIEVEMENT_RANK.PLATINUM;
}

// An Achievement outside any ladder or group, such as rage quit. Its
// structure says nothing about how hard it is, hence Gold unless stated.
// Only such an Achievement can be secret, with getHint: a ladder's step or
// a group completion is a goal to aim at.
export function standaloneAchievement({ id, family, rank = ACHIEVEMENT_RANK.GOLD, getTitle, getDescription, checkUnlocked, getHint }) {
    return { id, family, rank, getTitle, getDescription, checkUnlocked, ...(getHint ? { getHint } : {}) };
}

// Below this target, an Achievement Progress would only ever read "0/1".
const MIN_PROGRESS_TARGET = 2;

// An Achievement unlocked once getCurrent() reaches target, with that same
// value as its Achievement Progress: the two can never disagree. With
// getRecord (the best value ever reached, never below getCurrent()), the
// record unlocks it instead, so it stays Unlocked when the value drops
// again, while a missing one still shows the value.
// Its rank comes either from its ladder, the thresholds of its series in
// order, and its step in it (its target unless the ladder counts something
// else, such as percentages), or, for a group completion, from the size of
// the group, which is its target.
export function countedAchievement({
    id, family, getTitle, getDescription, target, unit, getCurrent, getRecord = getCurrent,
    ladder, step = target, isGroupCompletion = false,
}) {
    const hasLadder = ladder !== undefined;
    if (hasLadder === isGroupCompletion) throw new Error(`${id} needs either a ladder or to be a group completion, not both`);
    return {
        id,
        family,
        rank: hasLadder ? ladderRank(ladder, step) : groupCompletionRank(target),
        getTitle,
        getDescription,
        checkUnlocked: () => getRecord() >= target,
        getProgress: () => (target >= MIN_PROGRESS_TARGET ? { current: getCurrent(), target, unit } : null),
    };
}

// Records in the named Profile, which may no longer be the active one, that
// it was Notified of the achievement.
export function markNotified(profileStore, profileName, id) {
    profileStore.updateProfileData(data => {
        if (!data.notified.includes(id)) data.notified.push(id);
    }, profileName);
}

// Calls onNewlyUnlocked(achievement) for each achievement the active
// Profile unlocked and was not yet Notified of.
export function evaluateAchievements(achievements, profileStore, onNewlyUnlocked) {
    const notified = new Set(profileStore.getProfileData().notified);
    for (const achievement of achievements) {
        if (achievement.checkUnlocked() && !notified.has(achievement.id)) {
            onNewlyUnlocked(achievement);
        }
    }
}