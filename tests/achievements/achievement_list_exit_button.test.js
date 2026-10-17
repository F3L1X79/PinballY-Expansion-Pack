// ============================================================
// The Achievement List's Exit Button, through main.js on the fake PinballY
// globals: Select on it goes back where Exit goes, the main menu on the
// Achievement List entry, or the Profile Stats on their Achievements button.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startPack, startOpeningFromMainMenu } from "./achievement_list_opening_scenario.js";
import { press, isListOpen, untilListShown, isMarkerOnExitButton } from "./achievement_list_reader.js";
import { openProfileStats, choose, highlighted, isProfileStatsOpen, PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("Select on the Exit Button goes back to the main menu on its entry, or to the Profile Stats on Achievements", async () => {
    const { fake, lang } = await startPack();
    const TEXT = lang.achievementList;

    startOpeningFromMainMenu(fake, lang);
    untilListShown(fake);
    assert.ok(isMarkerOnExitButton(fake), "the list opens on the Exit Button");
    assert.ok(press(fake, "Select").defaultPrevented, "Select never reaches the wheel");
    assert.equal(isListOpen(fake), false);
    assert.equal(fake.executedCommands().at(-1), globalThis.command.ShowMainMenu, "the main menu reopens");
    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    assert.deepEqual(fake.currentMenu().items.filter(item => item.selected).map(item => item.title), [TEXT.menuEntry],
        "on the Achievement List entry");
    fake.closeMenu();

    openProfileStats(fake, lang);
    choose(fake, lang.profileStats.buttons.achievements);
    untilListShown(fake);
    press(fake, "Select");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(isListOpen(fake), false);
    assert.ok(isProfileStatsOpen(fake));
    assert.equal(highlighted(fake), lang.profileStats.buttons.achievements);

    assertNoErrorLogged(fake);
});
