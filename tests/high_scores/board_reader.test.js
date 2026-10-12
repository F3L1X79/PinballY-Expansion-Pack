// ============================================================
// The board reader on the lines PinballY returns for a table's high
// scores, mostly real boards from the cabinet report of the
// prototype/high-scores-probe branch (PINemHi 3.6.8 and 1.3.1, 107 tables),
// and which places of an "after" board are new against a "before" board.
// Run with "node --test" from the project folder.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readBoard, newPlaces } from "../../common/high_scores/board_reader.js";

const place = (rank, initials, score) => ({ rank, initials, score });

test("Back to the Future: the WORLD RECORD comes first, then TODAY'S HI-SCORE, and the loop champion after the first group is left out", () => {
    const board = readBoard([
        "WORLD RECORD",
        "JEK    7?500?000",
        "",
        "TODAY'S HI-SCORE",
        "1) RAY    6?500?000",
        "2) BLS    5?500?000",
        "3) NBW    4?500?000",
        "4) P G    3?500?000",
        "5) A A    2?500?000",
        "",
        "LOOP BACK CHAMP",
        "CHP   7",
        "",
    ]);

    assert.deepEqual(board, {
        status: "board",
        places: [
            place(1, "JEK", 7500000),
            place(2, "RAY", 6500000),
            place(3, "BLS", 5500000),
            place(4, "NBW", 4500000),
            place(5, "P G", 3500000),
            place(6, "A A", 2500000),
        ],
    });
});

test("The Machine Bride of Pin-bot: the billionaire club is a special champion, the GRAND CHAMPION and the HIGHEST SCORES are one board", () => {
    const board = readBoard([
        "BILLIONAIRE CLUB MEMBERS",
        "BRE   1?004?206?800",
        "SLL   1?001?005?690",
        "",
        "GRAND CHAMPION",
        "JT       15?000?000",
        "",
        "HIGHEST SCORES",
        "1) ZB       12?000?000",
        "2) DWF      11?000?000",
        "3) JWH      10?000?000",
        "4) RK        9?000?000",
        "",
    ]);

    assert.deepEqual(board.places, [
        place(1, "JT", 15000000),
        place(2, "ZB", 12000000),
        place(3, "DWF", 11000000),
        place(4, "JWH", 10000000),
        place(5, "RK", 9000000),
    ]);
});

test("The Getaway: the loop champion is a statistic, not a place", () => {
    const board = readBoard([
        "GRAND CHAMPION",
        "DWF     200?000?000",
        "",
        "ACE DRIVERS",
        "1) DTW     150?000?000",
        "2) SSR     125?000?000",
        "3) XAQ     100?000?000",
        "4) AJS      75?000?000",
        "",
        "LOOP CHAMPION",
        "DWF - 3 LOOPS",
        "",
    ]);

    assert.deepEqual(board.places.map(p => p.initials), ["DWF", "DTW", "SSR", "XAQ", "AJS"]);
});

test("Godzilla: a statistic heads the board and places without a score are skipped", () => {
    const board = readBoard([
        "5 MULTIBALLS CHAMPS",
        "1) JEK",
        "2) JEK",
        "3) JEK",
        "4) JEK",
        "5) JEK",
        "",
        "HIGHEST SCORES",
        "#1  JOE            250?000?000",
        "#2  JEK            225?000?000",
        "#3  NF             200?000?000",
        "#4  DAY            175?000?000",
        "#5  ION            150?000?000",
        "#6  KRT            125?000?000",
        "#7  JAY            120?000?000",
        "#8  LON            115?000?000",
        "#9  MT             110?000?000",
        "#10 RAY            105?000?000",
        "",
    ]);

    assert.equal(board.places.length, 10);
    assert.deepEqual(board.places[0], place(1, "JOE", 250000000));
    assert.deepEqual(board.places[9], place(10, "RAY", 105000000));
});

test("Cirqus Voltaire, The Flintstones, Super Mario Bros.: a score under a title out of the champion list is a special champion", () => {
    for (const special of [["CANNON BALL CHAMPION", "TEX - 50"], ["TOP BOWLER", "JBJ   120"], ["REPLAY SCORE", "49?000?000"]]) {
        const board = readBoard([
            ...special,
            "",
            "HIGHEST SCORES",
            "1) JET     250?000?000",
            "2) CM      200?000?000",
            "3) DAV     165?000?000",
            "",
        ]);

        assert.deepEqual(board.places.map(p => p.initials), ["JET", "CM", "DAV"], special[0]);
    }
});

test("Wipe Out: places split under several titles stay one board", () => {
    const board = readBoard([
        "REPLAY SCORE",
        "175?000?000",
        "",
        "PSYCHO SKIER",
        "1) IBM     660?000?000",
        "",
        "HOT DOGS",
        "2) CEN     280?000?000",
        "3) PDG     240?000?000",
        "4) OTC     200?000?000",
        "5) MOO     160?000?000",
        "",
    ]);

    assert.deepEqual(board.places.map(p => p.initials), ["IBM", "CEN", "PDG", "OTC", "MOO"]);
});

test("Black Knight, Star Gazer, Mr. & Mrs. Pac-Man: a single high score with no initials is a board of one", () => {
    assert.deepEqual(readBoard(["HIGHEST SCORE", "2?500?000", ""]), { status: "board", places: [place(1, "", 2500000)] });
    assert.deepEqual(readBoard(["HIGHEST SCORE", "1?141?250", ""]), { status: "board", places: [place(1, "", 1141250)] });
    assert.deepEqual(readBoard(["HIGHEST SCORE", "163?090", ""]), { status: "board", places: [place(1, "", 163090)] });
});

test("Seawitch: a single reset slot under 10 is an empty board", () => {
    assert.deepEqual(readBoard(["HIGHEST SCORE", "0", ""]), { status: "empty", places: [] });
});

test("Tom & Jerry: a place with no score is an empty board", () => {
    assert.deepEqual(readBoard(["TOP MISCHIEF -- MAKERS", "1) "]), { status: "empty", places: [] });
});

test("no line at all is an empty board", () => {
    assert.deepEqual(readBoard([]), { status: "empty", places: [] });
});

test("Starship Troopers with PINemHi 1.3.1: \"Not supported rom\" is unsupported", () => {
    const board = readBoard(["Not supported rom : C:\\vPinball\\VisualPinball\\VPinMAME\\nvram\\startrp2.nv", ""]);

    assert.deepEqual(board, { status: "unsupported", places: [] });
});

test("an unranked score counts under any title of the champion list, in any case, and never with no title", () => {
    assert.deepEqual(readBoard(["Champion", "JEK 5?000?000"]).places, [place(1, "JEK", 5000000)]);
    assert.deepEqual(readBoard(["MASTER  MAGICIAN", "JBJ 800?000?000"]).places, [place(1, "JBJ", 800000000)]);
    assert.deepEqual(readBoard(["JEK 5?000?000"]), { status: "empty", places: [] });
    assert.deepEqual(readBoard(["GRAND CHAMPION", "", "JEK 5?000?000"]), { status: "empty", places: [] });
});

test("a score followed by a word is a statistic: ignored, and not a title either", () => {
    const board = readBoard(["GRAND CHAMPION", "20 COMBOS", "JEK   5?000?000", "1) RAY   4?000?000 2 CASTLES", ""]);

    assert.deepEqual(board.places, [place(1, "JEK", 5000000)]);
});

test("every thousands separator is accepted, as it reached JS on the cabinet (\"?\") or elsewhere", () => {
    for (const separator of ["?", ".", ",", "'", " ", "\u00A0", "\u202F", "\u00FF", "\uFFFD"]) {
        const board = readBoard(["1) JEK   7" + separator + "500" + separator + "000"]);

        assert.deepEqual(board.places, [place(1, "JEK", 7500000)], JSON.stringify(separator));
    }
});

test("every rank form makes a place, whatever the title above it", () => {
    for (const rank of ["1)", "#1", "1#", "1,", "1.:"]) {
        const board = readBoard(["BEST CITIZENS", rank + " JEK   7,500,000"]);

        assert.deepEqual(board.places, [place(1, "JEK", 7500000)], rank);
    }
});

test("the first group ends at the first blank line once 3 places were found", () => {
    const board = readBoard([
        "GRAND CHAMPION", "AAA 9?000?000", "",
        "HIGHEST SCORES", "1) BBB 8?000?000", "",
        "2) CCC 7?000?000", "",
        "BUDDIES", "1) DDD 6?000?000",
    ]);

    assert.deepEqual(board.places.map(p => p.initials), ["AAA", "BBB", "CCC"]);
});

test("a place repeating an earlier one, same initials and score, is ignored", () => {
    const board = readBoard(["GRAND CHAMPION", "JEK 9?000?000", "", "HIGHEST SCORES", "1) jek 9?000?000", "2) JEK 8?000?000", "3) RAY 9?000?000"]);

    assert.deepEqual(board.places, [place(1, "JEK", 9000000), place(2, "JEK", 8000000), place(3, "RAY", 9000000)]);
});

// Jokerz! before a Play, as read on the cabinet.
const JOKERZ_BEFORE = [place(1, "BSO", 5000000), place(2, "PVA", 4500000), place(3, "PFZ", 4000000), place(4, "CPG", 3500000)];

test("a score that entered the board is new, the scores that moved down are not", () => {
    const after = [place(1, "BSO", 5000000), place(2, "JEK", 4800000), place(3, "PVA", 4500000), place(4, "PFZ", 4000000)];

    assert.deepEqual(newPlaces(JOKERZ_BEFORE, after), [place(2, "JEK", 4800000)]);
});

test("an unchanged board has no new place", () => {
    assert.deepEqual(newPlaces(JOKERZ_BEFORE, JOKERZ_BEFORE), []);
});

test("each place of the \"before\" board matches once: the same score twice against one is one new place", () => {
    const before = [place(1, "JEK", 5000000), place(2, "RAY", 4000000)];
    const after = [place(1, "JEK", 5000000), place(2, "JEK", 5000000), place(3, "RAY", 4000000)];

    assert.deepEqual(newPlaces(before, after), [place(2, "JEK", 5000000)]);
});
