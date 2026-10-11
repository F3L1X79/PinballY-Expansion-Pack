// ============================================================
// Dialog priority with the add-ons started in the reverse of main.js's
// order: the same dialogs must appear in the same order.
// ============================================================

import { test } from "node:test";
import { runDialogPriorityScenario } from "./dialog_priority_scenario.js";

test("dialogs follow the fixed priority whatever the add-on order", async () => {
    await runDialogPriorityScenario(["startupChoicePrompt", "ratingPrompt", "achievements", "sessionStatsTracker"]);
});
