// ============================================================
// Beat the Grown-Ups through main.js on the fake PinballY globals, with the
// High Scores Add-on off: absent from a child's Achievement List while Snack
// Time and Wednesday Off remain, back once the Add-on is on again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../common/core/config.js";
import { startHighScores } from "../high_scores/high_scores_scenario.js";
import { getAllAchievements } from "../../addons/achievements_engine.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("Beat the Grown-Ups is absent while the High Scores Add-on is off, the time Achievements remain", async () => {
    const { fake, readShown } = await startHighScores({
        addOns: ["achievements", "customMenuCommands"], profiles: { Kid: { isChild: true } }, active: "Kid",
    });
    assert.deepEqual(readShown(["Beat the Grown-Ups"]), [undefined]);
    const idsOfKid = () => getAllAchievements({ profileName: "Kid" }).map(achievement => achievement.id);
    assert.ok(idsOfKid().includes("snackTime") && idsOfKid().includes("wednesdayOff"));
    assert.ok(!idsOfKid().includes("grownUpRecordTaken"));

    config.addOns.highScores = true;
    assert.ok(idsOfKid().includes("grownUpRecordTaken"), "back with the Add-on on");

    assertNoErrorLogged(fake);
});
