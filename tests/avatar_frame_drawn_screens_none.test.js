// ============================================================
// A Profile wearing no Avatar Frame on the drawn screens, through main.js
// on the fake PinballY globals: with frames unlocked but "None" chosen,
// the Welcome Screen, the Profile Stats card and the Achievement List
// header keep the plain Avatar, the header its double gold frame.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines } from "./mastery_bar_scenario.js";
import { walkDrawnScreens } from "./avatar_frame_drawn_screens_scenario.js";

test("a Profile wearing none keeps the plain Avatar on every drawn screen", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands", "profilePicker", "startupChoicePrompt"], frameImages: true,
        profiles: { guest: { collectionTier: 2, avatarFrame: null } },
    });
    assert.deepEqual(await walkDrawnScreens(fake), { welcomeScreen: null, profileStats: null, achievementList: null, listGoldFrame: true });
    assert.deepEqual(errorLines(fake), []);
});
