// ============================================================
// No Avatar Frame on the drawn screens with the Table Mastery Add-on off,
// through main.js on the fake PinballY globals: a worn frame left in
// profile.json shows neither on the Welcome Screen, nor on the Profile
// Stats card, nor in the Achievement List header, which keeps its double
// gold frame.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines } from "../mastery/mastery_bar_scenario.js";
import { walkDrawnScreens } from "./avatar_frame_drawn_screens_scenario.js";

test("no frame on any drawn screen with Table Mastery off", async () => {
    const fake = await startScenario({
        addOns: ["achievements", "customMenuCommands", "profilePicker", "startupChoicePrompt"], frameImages: true,
        profiles: { guest: { collectionTier: 2, avatarFrame: 2 } },
    });
    assert.deepEqual(await walkDrawnScreens(fake), { welcomeScreen: null, profileStats: null, achievementList: null, listGoldFrame: true });
    assert.deepEqual(errorLines(fake), []);
});
