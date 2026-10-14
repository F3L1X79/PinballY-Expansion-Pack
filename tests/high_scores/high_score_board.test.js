// ============================================================
// The High Score Board, through main.js on the fake PinballY globals: the
// "High Scores" main menu entry right before Table Setup opens the
// selected table's last known board, the 1st in the middle of the podium,
// the 2nd on its left, the 3rd on its right, each with its owner's name
// and Avatar or "Default score", the places after them in rows below.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL, avatarOf, avatarFiles } from "./high_scores_scenario.js";
import { mainMenuTitles, openBoard, isBoardOpen, title, podium, rows, message } from "./high_score_board_reader.js";

test("the entry sits right before Table Setup and opens the podium with each place's owner", async () => {
    const { fake, setBoard, play, switchTo } = await startHighScores({
        addOns: ["highScores", "customMenuCommands"], profiles: { Alice: {}, Bob: {} }, active: "Alice", files: avatarFiles("Alice", "Bob"),
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    switchTo("Bob");
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["", "55000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });

    const { titles, boardEntry } = mainMenuTitles(fake);
    assert.equal(titles[boardEntry], "High Scores");
    assert.equal(titles[boardEntry + 1], lang.customMenuLabels.tableSetup);

    openBoard(fake, lang);
    assert.ok(isBoardOpen(fake));
    assert.equal(title(fake), "Medieval Madness");
    assert.equal(message(fake), null);
    assert.deepEqual(podium(fake, lang), {
        left: { rank: "2", name: "Bob", avatar: avatarOf("Bob"), initials: "—", score: "55,000,000", isTableRecord: false },
        middle: { rank: "1", name: "Alice", avatar: avatarOf("Alice"), initials: "ALI", score: "60,000,000", isTableRecord: true },
        right: { rank: "3", name: "Default score", avatar: null, initials: "SLL", score: "52,000,000", isTableRecord: false },
    });
    assert.deepEqual(rows(fake, lang), [
        { rank: "4", name: "Default score", avatar: null, initials: "BRE", score: "40,000,000", isTableRecord: false },
        { rank: "5", name: "Default score", avatar: null, initials: "LFS", score: "30,000,000", isTableRecord: false },
    ]);
});
