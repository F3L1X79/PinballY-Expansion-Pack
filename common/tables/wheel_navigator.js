// ============================================================
// Utilities for animating PinballY's game wheel to a target index by
// simulating "Next" / "NextPage" button presses, with a "wheel of
// fortune" timing curve (fast start, slow finish).
// ============================================================

const ACCELERATION_DELAYS_MS = [200, 150, 100, 50];
const DECELERATION_DELAYS_MS = [100, 200, 350, 500, 750, 1000];
const SHORT_NAVIGATION_THRESHOLD = 20;

/** Resolves after `ms` milliseconds. */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

/**
 * Computes the delay (ms) before the next button press, following a
 * "wheel of fortune" style curve: fast at first, then decelerating toward
 * the end, scaled from `delayOptions.baseSpeedMs`.
 *
 * @param {number} stepIndex 1-based index of the step about to run.
 * @param {number} totalSteps Total number of steps in the animation.
 * @param {{baseSpeedMs?: number}} [delayOptions]
 * @returns {number} Delay in milliseconds.
 */
export function computeStepDelay(stepIndex, totalSteps, delayOptions = {}) {
    const baseSpeedMs = Math.max(0, Number(delayOptions.baseSpeedMs ?? 200) || 0);
    const safeStepIndex = Math.max(1, Number(stepIndex) || 1);
    const safeTotalSteps = Math.max(safeStepIndex, Number(totalSteps) || safeStepIndex);

    if (safeStepIndex <= ACCELERATION_DELAYS_MS.length) {
        return baseSpeedMs + ACCELERATION_DELAYS_MS[safeStepIndex - 1];
    }

    const stepsRemaining = safeTotalSteps - safeStepIndex;
    if (stepsRemaining === 0) {
        return baseSpeedMs
            + DECELERATION_DELAYS_MS[DECELERATION_DELAYS_MS.length - 1]
            + Math.floor(Math.random() * 700);
    }

    if (stepsRemaining < DECELERATION_DELAYS_MS.length) {
        return baseSpeedMs + DECELERATION_DELAYS_MS[DECELERATION_DELAYS_MS.length - 1 - stepsRemaining];
    }

    return baseSpeedMs;
}

/**
 * Presses a button repeatedly, waiting between presses according to
 * `computeStepDelay` so the whole animation follows one timing curve.
 *
 * @returns {Promise<void>} Resolves once every press (and its delay) is done.
 */
export async function pressButtonRepeatedly(
    buttonName,
    times,
    stepOffset,
    totalSteps,
    delayOptions
) {
    const safeTimes = Math.max(0, Math.floor(Number(times) || 0));
    const safeStepOffset = Math.max(0, Math.floor(Number(stepOffset) || 0));

    for (let i = 0; i < safeTimes; i++) {
        mainWindow.doButtonCommand(buttonName, true, 0);
        mainWindow.doButtonCommand(buttonName, false, 0);

        await sleep(computeStepDelay(
            safeStepOffset + i + 1,
            totalSteps,
            delayOptions
        ));
    }
}

function getGameFirstLetter(game) {
    if (!game) return "";
    const value = game.configId ?? game.title;
    return String(value ?? "").charAt(0);
}

/**
 * Splits a wheel navigation of `targetIndex` steps into "page jumps"
 * (NextPage, roughly one per starting letter crossed) and "item jumps"
 * (Next, one per table). This avoids hundreds of single-table "Next"
 * presses for long jumps by using page-jumps to cross most of the alphabet,
 * then fine-tuning with individual "Next" presses.
 * Falls back to item-only jumps for short distances (<= 20 tables).
 *
 * @param {number} targetIndex Index to reach, relative to the current position.
 * @param {object[]} games Ordered game list, as returned by gameList.getAllWheelGames().
 * @returns {{pageJumpCount: number, itemJumpCount: number}}
 */
export function computeNavigationPlan(targetIndex, games) {
    const safeTargetIndex = Math.max(0, Math.floor(Number(targetIndex) || 0));
    if (safeTargetIndex <= SHORT_NAVIGATION_THRESHOLD) {
        return { pageJumpCount: 0, itemJumpCount: safeTargetIndex };
    }

    if (!Array.isArray(games) || games.length === 0) {
        return { pageJumpCount: 0, itemJumpCount: safeTargetIndex };
    }

    const cappedTargetIndex = Math.min(safeTargetIndex, games.length - 1);
    const letterChangeIndexes = [];
    let previousFirstLetter = getGameFirstLetter(games[0]);

    for (let i = 0; i < cappedTargetIndex; i++) {
        const firstLetter = getGameFirstLetter(games[i]);
        if (firstLetter !== previousFirstLetter) {
            previousFirstLetter = firstLetter;
            letterChangeIndexes.push(i);
        }
    }

    let pageJumpCount = 0;
    let lastPageJumpIndex = cappedTargetIndex;

    for (const letterChangeIndex of letterChangeIndexes) {
        pageJumpCount++;
        const remaining = cappedTargetIndex - letterChangeIndex;

        if (remaining < SHORT_NAVIGATION_THRESHOLD) {
            if (remaining <= 0) pageJumpCount--;
            else lastPageJumpIndex = letterChangeIndex;
            break;
        }

        lastPageJumpIndex = letterChangeIndex;
    }

    return {
        pageJumpCount,
        itemJumpCount: cappedTargetIndex - lastPageJumpIndex,
    };
}

// Animates the wheel from its current position (index 0 of `games`, as
// returned by gameList.getAllWheelGames()) to exactly `targetIndex`.
// Options: baseSpeedMs (timing curve), usePageJumpOptimization (NextPage
// jumps for long distances).
export async function animateWheelTo(games, targetIndex, options = {}) {
    const safeGames = Array.isArray(games) ? games : [];
    if (safeGames.length === 0) return;

    const maxIndex = safeGames.length - 1;
    const safeTargetIndex = Math.max(0, Math.min(
        maxIndex,
        Math.floor(Number(targetIndex) || 0)
    ));

    if (safeTargetIndex === 0) return;

    const usePageJumpOptimization = options.usePageJumpOptimization ?? false;
    const delayOptions = { baseSpeedMs: options.baseSpeedMs };

    let pageJumpCount = 0;
    let itemJumpCount = safeTargetIndex;

    if (usePageJumpOptimization) {
        const plan = computeNavigationPlan(safeTargetIndex, safeGames);
        pageJumpCount = plan.pageJumpCount;
        itemJumpCount = plan.itemJumpCount;
    }

    const totalSteps = pageJumpCount + itemJumpCount;

    if (pageJumpCount > 0) {
        await pressButtonRepeatedly(
            "NextPage",
            pageJumpCount,
            0,
            totalSteps,
            delayOptions
        );
    }

    await pressButtonRepeatedly(
        "Next",
        itemJumpCount,
        pageJumpCount,
        totalSteps,
        delayOptions
    );
}
