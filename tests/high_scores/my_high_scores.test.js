// ============================================================
// My High Scores, through main.js on the fake PinballY globals: its entry
// sits right under Most Played Tables while the active Profile holds a
// place on a board, and picking it puts on the wheel the tables it can
// see where it still holds one, best place first, then by title. A High
// Score pushed off the board and a hidden table are left out. A Profile
// switch while it is current shows the new Profile's tables, or every
// table when it holds no place.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, HIGH_SCORES_FILE } from "./high_scores_scenario.js";
import { mainMenuSection } from "../support/main_menu_reader.js";
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

    assert.deepEqual(mainMenuSection(fake, myHighScoresFilter), ["All Tables", hallOfFameFilter, myHighScoresFilter, "Favorites"]);

    chooseFilter(fake);
    assert.deepEqual(wheelTitles(fake), ["Attack from Mars", "Addams Family", "Medieval Madness"]);

    switchTo("Bob");
    await settle();
    assert.deepEqual(wheelTitles(fake), ["Medieval Madness", "Theatre of Magic", "Twilight Zone"], "Bob's places");

    switchTo("Carol");
    await settle();
    assert.equal(fake.getWheelTables().length, 5, "every table back for a Profile with no place");
    assert.equal(mainMenuSection(fake, myHighScoresFilter), null, "no entry for a Profile with no place");

    assertNoErrorLogged(fake);
});
