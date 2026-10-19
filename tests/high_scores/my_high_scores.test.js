// ============================================================
// My High Scores through main.js: the entry shows while the Profile holds a
// place and puts those tables on the wheel, best place first. Pushed-off
// places and hidden tables are left out; a Profile switch updates it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, HIGH_SCORES_FILE } from "./high_scores_scenario.js";
import { filterPickerSection } from "../support/main_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { settle } from "../support/fake_pinbally_host.js";

const table = (id, title, isHidden = false) => ({ id, configId: `${title} (1990)`, title, manufacturer: "Williams", year: 1990, isHidden, rom: `rom_${id}` });
const MEDIEVAL = table(1, "Medieval Madness");
const MARS = table(2, "Attack from Mars");
const ADDAMS = table(3, "Addams Family");
const THEATRE = table(4, "Theatre of Magic");
const TWILIGHT = table(5, "Twilight Zone");
const PAC_MAN = table(6, "Pac-Man", true);

const place = (rank, owner) => ({ rank, initials: "AAA", score: 1000 - rank, owner });
const BOARDS = {
    [MEDIEVAL.configId]: [place(1, "Bob"), place(2, "Alice"), place(3, "Alice")],
    [MARS.configId]: [place(1, "Alice")],
    [ADDAMS.configId]: [place(1, null), place(2, "Alice")],
    [THEATRE.configId]: [place(1, "Bob")],
    // Alice's High Score there was pushed off the board since.
    [TWILIGHT.configId]: [place(1, "Bob"), place(2, null)],
    [PAC_MAN.configId]: [place(1, "Alice")],
};
const HIGH_SCORES = {
    version: 1,
    tables: Object.fromEntries(Object.entries(BOARDS).map(([configId, board]) => [configId, { board }])),
    highScores: [{ profile: "Alice", configId: TWILIGHT.configId, score: 500, initials: "ALI", place: 2, date: "2026-10-01T20:00:00", tableRecord: false, takenFrom: null }],
};

const FILTER_ID = "User.project.MyHighScores";
const wheelTitles = fake => fake.getWheelTables().map(game => game.title);
// Chooses the filter, then the menu closes.
function chooseFilter(fake) {
    fake.selectFilter(FILTER_ID);
    fake.fire("wheelmode");
}

test("My High Scores lists the active Profile's places, best first, and follows a Profile switch", async () => {
    const { fake, switchTo } = await startHighScores({
        addOns: ["highScores", "hallOfFame"],
        profiles: { Alice: {}, Bob: {}, Carol: {} },
        active: "Alice",
        tables: [MEDIEVAL, MARS, ADDAMS, THEATRE, TWILIGHT, PAC_MAN],
        files: { [HIGH_SCORES_FILE]: JSON.stringify(HIGH_SCORES) },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    const { hallOfFameFilter, myHighScoresFilter } = lang.customMenuLabels;

    assert.deepEqual(filterPickerSection(fake, myHighScoresFilter), ["All Tables", hallOfFameFilter, myHighScoresFilter, "Favorites"]);

    chooseFilter(fake);
    assert.deepEqual(wheelTitles(fake), ["Attack from Mars", "Addams Family", "Medieval Madness"]);

    switchTo("Bob");
    await settle();
    assert.deepEqual(wheelTitles(fake), ["Medieval Madness", "Theatre of Magic", "Twilight Zone"], "Bob's places");

    switchTo("Carol");
    await settle();
    assert.equal(fake.getWheelTables().length, 5, "every table back for a Profile with no place");
    assert.equal(filterPickerSection(fake, myHighScoresFilter), null, "no entry for a Profile with no place");

    assertNoErrorLogged(fake);
});
