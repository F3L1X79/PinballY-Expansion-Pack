// ============================================================
// The High Score Board of a learned original table, through main.js on
// the fake PinballY globals: PinballY reads no board for it, so each
// opening reads its learned VPReg.stg section fresh, recorded as a board
// read outside a Play; the places show their owners, the podium and the
// crowns like a ROM table's.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, avatarFiles, avatarOf, defaultScoreImageFiles, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, OTHER_SECTIONS, vpregBoard } from "./high_scores_scenario.js";
import { openBoard, message, note, podium, rows, crowns, crowned } from "./high_score_board_reader.js";

test("a learned original table's board is read fresh from its section, with owners, podium and crowns", async () => {
    const { fake, setVpreg, play, saved, log } = await startHighScores({
        profiles: { Alice: {} }, active: "Alice", tables: [ZELDA_TABLE], files: { ...avatarFiles("Alice"), ...defaultScoreImageFiles(1, 2, 3) },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    setVpreg({ ...OTHER_SECTIONS, ZELDA: ZELDA_FACTORY });
    await play(ZELDA, { afterVpreg: { ...OTHER_SECTIONS, ZELDA: vpregBoard(["AAA", 2800000], ["FEF", 2750000], ["BBB", 2700000], ["CCC", 2600000]) } });
    // Played since outside the pack: a new Table Record.
    setVpreg({ ...OTHER_SECTIONS, ZELDA: vpregBoard(["ZZZ", 2900000], ["AAA", 2800000], ["FEF", 2750000], ["BBB", 2700000]) });
    const logged = log().length;

    openBoard(fake, lang);
    fake.advanceTime(1000);
    await settle();

    assert.equal(message(fake), null);
    assert.equal(note(fake), null);
    const shown = podium(fake, lang);
    assert.deepEqual([shown.left, shown.middle, shown.right].map(step => [step.rank, step.name, step.initials, step.score, step.isTableRecord]), [
        ["2", "Default score", "AAA", "2,800,000", false],
        ["1", "Default score", "ZZZ", "2,900,000", true],
        ["3", "Alice", "FEF", "2,750,000", false],
    ]);
    assert.equal(shown.right.avatar, avatarOf("Alice"));
    assert.deepEqual(rows(fake, lang).map(row => [row.rank, row.initials]), [["4", "BBB"]]);
    assert.deepEqual(crowns(fake), { left: crowned("crown_silver.png"), middle: crowned("crown_gold.png"), right: crowned("crown_bronze.png") });
    assert.deepEqual(saved().tables[ZELDA].board.map(entry => [entry.initials, entry.owner]), [["ZZZ", null], ["AAA", null], ["FEF", "Alice"], ["BBB", null]]);
    assert.equal(saved().highScores.length, 1);
    assert.ok(log().slice(logged).includes(`[HighScores] "${ZELDA}": board read from VPReg.stg section "ZELDA" for the High Score Board (User folder read in 0 ms).`));
});
