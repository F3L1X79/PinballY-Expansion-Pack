// ============================================================
// Giving up the active Profile's Profile Stats while they get ready,
// through main.js on the fake PinballY globals: Next, Prev and Select are
// swallowed; Exit gives up (no veil, no Loader, no layer of the screen
// left) and ends where Exit on the open screen ends, the main menu
// reopened on "Your Stats"; attract mode gives up the same way.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import { startOpeningProfileStats, isProfileStatsOpen, profileStatsLayerCount, press } from "./profile_stats_reader.js";

const DRAW_MS = 60;

function assertNothingLeft(fake) {
    assert.deepEqual(readVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    assert.equal(loaderLayerCount(fake), 0);
    assert.equal(profileStatsLayerCount(fake), 0, "no layer of the screen");
}

test("Exit or attract mode while the Profile Stats get ready gives them up; other buttons are swallowed", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    fake.setDrawMs(DRAW_MS);

    startOpeningProfileStats(fake, lang);
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");
    for (const button of ["Next", "Prev", "Select"]) {
        assert.ok(press(fake, button).defaultPrevented, `${button} never reaches the wheel`);
    }
    assert.equal(readLoader(fake).shown, true, "still getting ready");

    assert.ok(press(fake, "Exit").defaultPrevented);
    assertNothingLeft(fake);
    fake.advanceTime(2000);
    assertNothingLeft(fake);
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(fake.executedCommands().at(-1), globalThis.command.ShowMainMenu, "the main menu reopens, as Exit on the open screen");
    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    assert.deepEqual(fake.currentMenu().items.filter(item => item.selected).map(item => item.title), [lang.profileStats.menuEntry], "on Your Stats");
    fake.closeMenu();

    startOpeningProfileStats(fake, lang);
    fake.advanceTime(200);
    assert.equal(readVeil(fake).shown, true, "getting ready again");
    fake.fire("attractmodestart", {});
    assertNothingLeft(fake);
    fake.advanceTime(2000);
    assertNothingLeft(fake);
    assert.equal(isProfileStatsOpen(fake), false);
    assertNoErrorLogged(fake);
});
