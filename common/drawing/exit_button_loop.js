// ============================================================
// The Exit Button's place in a drawn screen's Next / Prev loop, for the
// screens that number their choices (Achievement List, Avatar Frame list,
// Household Stats): EXIT_BUTTON stands for it in place of a choice's
// index, first in the loop. Only arithmetic: no drawing, no event, no
// side effect.
// ============================================================

export const EXIT_BUTTON = -1;

// The selection after a step (direction: 1 for Next, -1 for Prev) from
// selected through the Exit Button then choiceCount choices, looping.
export function stepThroughExitButton(selected, direction, choiceCount) {
    const places = choiceCount + 1;
    return ((selected + 1 + direction + places) % places) - 1;
}
