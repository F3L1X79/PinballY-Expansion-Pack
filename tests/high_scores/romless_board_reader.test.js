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

test("Game of Thrones' section gives its sixteen places by score", () => {
    const places = readSectionBoard(sections.gameofthrones);
    assert.equal(places.length, 16);
    assert.deepEqual(places.slice(0, 6).map(place => [place.rank, place.initials, place.score]), [
        [1, "AAA", 750000000], [2, "BBB", 500000000], [3, "CCC", 400000000],
        [4, "DDD", 300000000], [5, "EEE", 200000000], [6, "FEF", 72105500],
    ]);
    assert.deepEqual(places.at(-1), { rank: 16, initials: "PPP", score: 1000000 });
});

test("a lone HighScore or HiScore makes a one-place board with empty initials", () => {
    assert.deepEqual(readSectionBoard(sections.smurfette), [{ rank: 1, initials: "", score: 10000 }]);
    assert.deepEqual(readSectionBoard(sections.nellie), [{ rank: 1, initials: "", score: 1000 }]);
});

test("a second board of feats is left out", () => {
    assert.deepEqual(readSectionBoard(sections.STLE), [
        { rank: 1, initials: "SBW", score: 1300000 },
        { rank: 2, initials: "JPS", score: 1200000 },
        { rank: 3, initials: "011", score: 1100000 },
        { rank: 4, initials: "011", score: 1000000 },
    ]);
    assert.equal(readSectionBoard({ SpecialHighScore1: "500000", SpecialHighScore1Name: "AAA" }), null);
});

test("initials that are not letters, digits or spaces read as empty", () => {
    assert.deepEqual(readSectionBoard({
        HighScore1: "300", HighScore1Name: " A B ",
        HighScore2: "200", HighScore2Name: "A*Z",
        HighScore3: "100", HighScore3Name: "\u0001\u0002",
    }).map(place => place.initials), ["A B", "", ""]);
});

test("a lone score that is empty is not a board", () => {
    assert.equal(readSectionBoard({ HighScore: "", Credits: "0" }), null);
    assert.equal(readSectionBoard({ HiScore: "0" }), null);
});

test("a lone score is read when the HighScoreN family is all empty", () => {
    assert.deepEqual(readSectionBoard({ HighScore1: "", HighScore1Name: "", HighScore: "5000" }), [{ rank: 1, initials: "", score: 5000 }]);
});
