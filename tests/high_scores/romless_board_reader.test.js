// ============================================================
// ROM-less board reader: turns a section of the cabinet's real VPReg.stg
// into a board of places, the same shape the board reader gives for
// PINemHi; a settings section is not a board.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readCompoundFile } from "../../common/high_scores/compound_file_reader.js";
import { readSectionBoard } from "../../common/high_scores/romless_board_reader.js";

const CABINET_VPREG = new URL("../../docs/research/high-scores-tools/user_folder/VPReg.stg", import.meta.url);
const sections = readCompoundFile(new Uint8Array(readFileSync(CABINET_VPREG)));

test("Zelda's section gives its four places by score", () => {
    assert.deepEqual(readSectionBoard(sections.ZELDA), [
        { rank: 1, initials: "AAA", score: 2800000 },
        { rank: 2, initials: "BBB", score: 2700000 },
        { rank: 3, initials: "CCC", score: 2600000 },
        { rank: 4, initials: "DDD", score: 2500000 },
    ]);
});

test("places are ordered by score, whatever slot holds them, and renumbered", () => {
    assert.deepEqual(readSectionBoard({
        HighScore1: "1500000", HighScore1Name: "AAA",
        HighScore2: "1700000", HighScore2Name: "FEF",
        HighScore3: "", HighScore3Name: "CCC",
        HighScore4: "5", HighScore4Name: "DDD",
    }), [
        { rank: 1, initials: "FEF", score: 1700000 },
        { rank: 2, initials: "AAA", score: 1500000 },
    ]);
});

test("a settings section is not a board", () => {
    assert.equal(readSectionBoard(sections.ww_lh6), null);
    assert.equal(readSectionBoard(sections.TAF_VPX_V2), null);
});

test("a section whose scores are all empty is not a board", () => {
    assert.equal(readSectionBoard(sections.Sonic), null);
});

test("equal scores keep their slot order", () => {
    assert.deepEqual(readSectionBoard(sections["Metal Slug"]).map(place => place.initials), ["AAA", "BBB", "CCC", "DDD"]);
});
