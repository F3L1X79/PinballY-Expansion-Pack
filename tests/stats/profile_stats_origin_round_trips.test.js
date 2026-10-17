// ============================================================
// The Profile Stats opened from "Your Stats" keep where they came from,
// through main.js on the fake PinballY globals: back from the Household
// Stats, the Achievement List and the Avatar Frame list, the Exit Button
// still says Back and Exit still reopens the main menu on "Your Stats".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import {
    openProfileStats, isProfileStatsOpen, highlighted, buttonHints, choose, press, untilProfileStatsFadedIn,
} from "./profile_stats_reader.js";
import { expectedButtonHints } from "../support/button_hints_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("back from the Household Stats, the Achievement List and the Avatar Frame list, Exit still reopens the main menu on Your Stats", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice", frameImages: true });
    const TEXT = lang.profileStats;

    openProfileStats(fake, lang);
    for (const button of [TEXT.buttons.household, TEXT.buttons.achievements, TEXT.buttons.frame]) {
        choose(fake, button);
        assert.equal(isProfileStatsOpen(fake), false, `${button} takes their place`);
        // Long enough for any of them to get ready and fade in.
        fake.advanceTime(2000);
        press(fake, "Exit");
        untilProfileStatsFadedIn(fake);
        assert.equal(highlighted(fake), button, `back from ${button}`);
        assert.deepEqual(buttonHints(fake), expectedButtonHints(lang, { exit: "back" }), `Exit still says Back after ${button}`);
    }

    choose(fake, lang.buttonHints.back);
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(fake.executedCommands().at(-1), globalThis.command.ShowMainMenu, "the main menu reopens");
    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    assert.deepEqual(fake.currentMenu().items.filter(item => item.selected).map(item => item.title), [TEXT.menuEntry]);
    assertNoErrorLogged(fake);
});
