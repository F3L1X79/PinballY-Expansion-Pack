// ============================================================
// After a play session, if the table's CUMULATIVE play time has just
// crossed config.askToRateAfterMinutesPlayed and the table isn't rated
// yet, hands the wheel dialog module a dialog offering to open PinballY's
// native rating dialog once back at the wheel. Listens to "gamestarted",
// "gameover" and "wheelmode".
// ============================================================

import lang from "../common/core/i18n.js";
import config from "../common/core/config.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "../common/core/wheel_dialog.js";
import { safeHandler } from "../common/core/safe_handler.js";

const SCRIPT_NAME = "RatingPrompt";

export default function init() {
    const { ratingPrompt: RATING_PROMPT_TEXT } = lang;
    const THRESHOLD_MINUTES = config.askToRateAfterMinutesPlayed;
    const THRESHOLD_SECONDS = THRESHOLD_MINUTES * 60;
    const wheelDialogs = getWheelDialogs();

    const playTimeAtSessionStart = new Map();

    // Fires on table launch: remembers the play time before this session.
    mainWindow.on("gamestarted", safeHandler(SCRIPT_NAME, ev => {
        playTimeAtSessionStart.set(ev.game.id, ev.game.playTime);
    }));

    // Game waiting for its prompt until the wheel is back.
    let pendingGame = null;

    // Fires on table exit: remembers the game if the threshold was just crossed.
    mainWindow.on("gameover", safeHandler(SCRIPT_NAME, ev => {
        const game = ev.game;
        const startPlayTime = playTimeAtSessionStart.get(game.id);
        playTimeAtSessionStart.delete(game.id);

        if (startPlayTime === undefined) return;
        if (game.rating >= 0) return;

        const justCrossedThreshold = startPlayTime < THRESHOLD_SECONDS && game.playTime >= THRESHOLD_SECONDS;
        if (justCrossedThreshold) pendingGame = game;
    }));

    // Fires on every return to the wheel, where the dialog can show.
    mainWindow.on("wheelmode", safeHandler(SCRIPT_NAME, () => {
        if (!pendingGame) return;
        const game = pendingGame;
        pendingGame = null;

        wheelDialogs.submit({
            id: "ratingPrompt",
            message: RATING_PROMPT_TEXT.message(game.title, THRESHOLD_MINUTES),
            buttons: [
                { label: RATING_PROMPT_TEXT.rateNow, action: () => mainWindow.doCommand(command.RateGame) },
                // No action: the dialog closing is all it must do.
                { label: RATING_PROMPT_TEXT.notNow },
            ],
            priority: DIALOG_PRIORITY.RATING_PROMPT,
        });
    }));
}
