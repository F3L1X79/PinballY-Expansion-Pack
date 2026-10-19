// ============================================================
// A long High Score Board: in a short landscape window the flippers scroll
// the rows one place at a time, the podium staying; a board that fits makes
// the flippers do nothing; a portrait window shows all ten places.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, board, FACTORY, MEDIEVAL } from "./high_scores_scenario.js";
import { openBoard, press, podium, rows } from "./high_score_board_reader.js";

const TEN_PLACES = board(
    ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"],
    ["DTW", "9000000"], ["CPG", "8000000"], ["JAB", "7000000"], ["MRP", "6000000"], ["KOZ", "5000000"],
);
const ROW_INITIALS = ["ZAP", "RCF", "DTW", "CPG", "JAB", "MRP", "KOZ"];

test("the flippers scroll a long board's rows under the fixed podium, and do nothing on a board that fits", async () => {
    const { fake, setBoard } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    const { default: lang } = await import("../../common/core/i18n.js");
    const rowsInView = () => rows(fake, lang).map(row => row.initials);
    const podiumInitials = () => Object.values(podium(fake, lang)).map(step => step.initials);
    // Opens the board and lets its fresh read end.
    const openRead = async () => {
        openBoard(fake, lang);
        await settle();
        fake.advanceTime(1000);
        await settle();
    };

    setBoard(MEDIEVAL, TEN_PLACES);
    await openRead();
    const shownAtOnce = rowsInView().length;
    assert.ok(shownAtOnce >= 1 && shownAtOnce < ROW_INITIALS.length, `${shownAtOnce} rows in view in a landscape window`);
    assert.deepEqual(rowsInView(), ROW_INITIALS.slice(0, shownAtOnce));
    assert.deepEqual(podiumInitials(), ["BRE", "SLL", "LFS"]);

    for (let first = 1; first <= ROW_INITIALS.length - shownAtOnce; first++) {
        assert.ok(press(fake, "Next").defaultPrevented);
        assert.deepEqual(rowsInView(), ROW_INITIALS.slice(first, first + shownAtOnce));
        assert.deepEqual(podiumInitials(), ["BRE", "SLL", "LFS"], "the podium stays in place");
    }
    assert.ok(press(fake, "Next").defaultPrevented, "past the last place");
    assert.deepEqual(rowsInView(), ROW_INITIALS.slice(-shownAtOnce));

    for (let first = ROW_INITIALS.length - shownAtOnce - 1; first >= 0; first--) {
        assert.ok(press(fake, "Prev").defaultPrevented);
        assert.deepEqual(rowsInView(), ROW_INITIALS.slice(first, first + shownAtOnce));
    }
    assert.ok(press(fake, "Prev").defaultPrevented, "before the 4th place");
    assert.deepEqual(rowsInView(), ROW_INITIALS.slice(0, shownAtOnce));
    press(fake, "Exit");

    setBoard(MEDIEVAL, FACTORY);
    await openRead();
    assert.deepEqual(rowsInView(), ["ZAP", "RCF"]);
    for (const button of ["Next", "Prev"]) {
        assert.ok(press(fake, button).defaultPrevented, `${button} never reaches the wheel`);
        assert.deepEqual(rowsInView(), ["ZAP", "RCF"]);
    }
    press(fake, "Exit");

    fake.setLayoutSize({ width: 1080, height: 1920 });
    setBoard(MEDIEVAL, TEN_PLACES);
    await openRead();
    assert.deepEqual(rowsInView(), ROW_INITIALS, "a portrait window shows every place");
    press(fake, "Next");
    assert.deepEqual(rowsInView(), ROW_INITIALS);
});
