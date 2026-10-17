// ============================================================
// The Profile Stats opened from the main menu's "Your Stats", through
// main.js on the fake PinballY globals: the Exit Button says Back, the
// Button Hints name the flippers, Select and Exit (Back), and Exit, or
// Select on the Exit Button, reopens the main menu on "Your Stats".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { openProfileStats, isProfileStatsOpen, highlighted, buttonHints, choose, press } from "./profile_stats_reader.js";
import { expectedButtonHints } from "../support/button_hints_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("from Your Stats, Exit and the Exit Button go back to the main menu on Your Stats", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    const openMainMenu = () => fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    const selectedEntries = () => fake.currentMenu().items.filter(item => item.selected).map(item => item.title);

    openProfileStats(fake, lang);
    assert.equal(highlighted(fake), lang.buttonHints.back, "the Exit Button says Back");
    assert.deepEqual(buttonHints(fake), expectedButtonHints(lang, { exit: "back" }));

    press(fake, "Exit");
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(fake.executedCommands().at(-1), globalThis.command.ShowMainMenu, "the main menu reopens");
    openMainMenu();
    assert.deepEqual(selectedEntries(), [lang.profileStats.menuEntry], "on Your Stats");
    fake.closeMenu();

    openProfileStats(fake, lang);
    choose(fake, lang.buttonHints.back);
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(fake.executedCommands().at(-1), globalThis.command.ShowMainMenu, "Select on the Exit Button does what Exit does");
    openMainMenu();
    assert.deepEqual(selectedEntries(), [lang.profileStats.menuEntry]);
    assertNoErrorLogged(fake);
});
