// ============================================================
// The Profile Stats reached through the Reward Prompt's "Go equip it",
// through main.js on the fake PinballY globals: back from the Avatar
// Frame list, nothing brings them back, so the Exit Button is the cross
// (Close), the Button Hints say Exit Close, and Exit leaves the bare
// wheel, no main menu reopened.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, play, playedFor, TABLES, MINUTE, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { settle } from "../support/fake_pinbally_host.js";
import { isProfileStatsOpen, highlighted, buttonHints, press, PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { expectedButtonHints } from "../support/button_hints_reader.js";
import { rewardPrompts } from "./reward_prompt_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const levelOne = playedFor(MINUTE);

test("from Go equip it, the Profile Stats show the cross and Exit leaves the bare wheel", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands"], frameImages: true,
        profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    fake.advanceTime(DRAWN_AHEAD_MS);
    await play(fake, FOURTH, MINUTE);
    await settle();
    assert.equal(rewardPrompts(fake).length, 1);

    fake.selectMenuItem("Go equip it");
    await settle();
    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(isProfileStatsOpen(fake), true);
    assert.deepEqual(buttonHints(fake), expectedButtonHints(lang, { exit: "close" }));
    // Back to the Exit Button, first in the loop, from the Frame button.
    const words = [lang.buttonHints.close, lang.buttonHints.back];
    for (let guard = 0; guard < 10 && !words.includes(highlighted(fake)); guard++) press(fake, "Prev");
    assert.equal(highlighted(fake), lang.buttonHints.close, "the Exit Button says Close");

    const commandsBefore = fake.executedCommands().length;
    press(fake, "Exit");
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(fake.currentMenu(), null, "on the bare wheel");
    assert.ok(!fake.executedCommands().slice(commandsBefore).includes(globalThis.command.ShowMainMenu), "no main menu reopened");
    assertNoErrorLogged(fake);
});
