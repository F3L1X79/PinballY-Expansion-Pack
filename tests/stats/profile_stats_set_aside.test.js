// ============================================================
// The Profile Stats set aside while the Achievement List or the Household
// Stats is open, through main.js on the fake PinballY globals: every layer
// hidden and reduced to a point, the Selection Marker still; the buttons
// pressed there never move nor choose anything on them; shown again, the
// unselected choices' tooltips stay hidden, the Exit Button and the footer
// look as when they first opened, the marker turns again, and Exit still
// reopens the main menu on "Your Stats".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/stats/profile_stats_painter.js";
import { isListOpen } from "../achievements/achievement_list_reader.js";
import { openProfileStats, isProfileStatsOpen, highlighted, buttonHints, choose, press } from "./profile_stats_reader.js";
import { untilHouseholdStatsFadedIn, highlightedColumn } from "./household_stats_reader.js";

const POINT = { xSpan: 0.001, ySpan: 0.001 };

const profileStatsLayers = fake => fake.drawingLayers().filter(layer => Object.values(PROFILE_STATS_Z_INDEX).includes(layer.zIndex));
const markerDrawings = fake => fake.drawings().filter(drawing => drawing.zIndex === PROFILE_STATS_Z_INDEX.marker).length;
const exitButtonLook = fake => profileStatsLayers(fake).filter(layer => layer.zIndex === PROFILE_STATS_Z_INDEX.exitButton && layer.alpha > 0)
    .map(layer => layer.strokes());
const shownTooltips = fake => profileStatsLayers(fake).filter(layer => layer.zIndex === PROFILE_STATS_Z_INDEX.tooltips && layer.alpha > 0);

function assertSetAside(fake) {
    assert.equal(isProfileStatsOpen(fake), false);
    for (const layer of profileStatsLayers(fake)) {
        assert.equal(layer.alpha, 0, "hidden");
        assert.deepEqual(layer.scale(), POINT, "reduced to a point");
    }
    const drawings = markerDrawings(fake);
    fake.advanceTime(1000);
    assert.equal(markerDrawings(fake), drawings, "the Selection Marker does not turn");
}

function assertShownAsFirstOpened(fake, first, label) {
    assert.equal(highlighted(fake), label);
    assert.deepEqual(shownTooltips(fake), [], "no tooltip beside a button");
    assert.deepEqual(buttonHints(fake), first.hints);
    assert.deepEqual(exitButtonLook(fake), first.exitButton);
    const drawings = markerDrawings(fake);
    fake.advanceTime(1000);
    assert.ok(markerDrawings(fake) > drawings, "the Selection Marker turns again");
}

test("set aside under the Achievement List and the Household Stats, the Profile Stats come back as they were left", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {}, Carol: {} }, active: "Alice" });
    const TEXT = lang.profileStats;
    openProfileStats(fake, lang);
    const first = { hints: buttonHints(fake), exitButton: exitButtonLook(fake) };

    choose(fake, TEXT.buttons.achievements);
    assert.ok(isListOpen(fake));
    assertSetAside(fake);
    for (const button of ["Next", "Next", "Prev", "Select"]) press(fake, button);
    assert.ok(isListOpen(fake), "the list alone took the buttons");
    press(fake, "Exit");
    assertShownAsFirstOpened(fake, first, TEXT.buttons.achievements);

    choose(fake, TEXT.buttons.household);
    untilHouseholdStatsFadedIn(fake);
    assertSetAside(fake);
    press(fake, "Next");
    assert.equal(highlightedColumn(fake), "Bob", "the Household Stats alone took the buttons");
    press(fake, "Exit");
    assertShownAsFirstOpened(fake, first, TEXT.buttons.household);

    choose(fake, lang.buttonHints.back);
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(profileStatsLayers(fake).length, 0, "nothing kept once left");
    assert.equal(fake.executedCommands().at(-1), globalThis.command.ShowMainMenu, "the main menu reopens");
    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    assert.deepEqual(fake.currentMenu().items.filter(item => item.selected).map(item => item.title), [TEXT.menuEntry], "on Your Stats");
    assertNoErrorLogged(fake);
});
