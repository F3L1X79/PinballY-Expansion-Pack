// ============================================================
// Random Game family: Achievements for playing 10, 25, 50 and 100 Random Games.
// Reads the count kept by common/tables/random_game.js, also shown as Achievement
// Progress; writes nothing. None when both Add-ons that offer a Random Game
// (the main menu entry, the Welcome Screen) are disabled.
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { getRandomGame } from "../common/tables/random_game.js";
import config from "../common/core/config.js";

// Each value is part of an Achievement ID: changing one would announce the
// Achievement again to players who already earned it. Each one also needs
// its title in every lang/ file.
const RANDOM_GAME_THRESHOLDS = [10, 25, 50, 100];

export function buildRandomGameFanAchievements() {
    // No Random Game can be launched then, so the family would stay locked
    // for good; also keeps the shared Random Game from being created here.
    if (!config.addOns.randomGame && !config.addOns.startupChoicePrompt) return [];

    const { achievements: TEXT } = lang;
    const randomGame = getRandomGame();

    return RANDOM_GAME_THRESHOLDS.map(count => countedAchievement({
        id: `randomGames:${count}`,
        family: ACHIEVEMENT_FAMILY.RANDOM_GAME,
        getTitle: () => TEXT.randomGamesTitles[count],
        getDescription: () => TEXT.randomGamesDescription(count),
        target: count,
        ladder: RANDOM_GAME_THRESHOLDS,
        unit: PROGRESS_UNIT.RANDOM_GAMES,
        getCurrent: randomGame.getRandomGamesPlayed,
    }));
}
