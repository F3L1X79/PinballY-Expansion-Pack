// ============================================================
// The High Score Board, through main.js on the fake PinballY globals: on
// a board of two places, the Gold crown over the 1st and the Silver over
// the 2nd, the 3rd's step left empty with no crown; a table never read
// shows its "Reading..." message with no crown at all.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, MEDIEVAL, avatarFiles } from "./high_scores_scenario.js";
import { openBoard, press, crowns, crowned, message, BOARD_OPEN_MS } from "./high_score_board_reader.js";

test("no crown over an empty step nor over a board not read yet", async () => {
    const { fake, setBoard, play, switchTo } = await startHighScores({
        profiles: { Alice: {}, Bob: {} }, active: "Bob", files: avatarFiles("Alice", "Bob"),
    });
    const { default: lang } = await import("../../common/core/i18n.js");

    // Opened on a table never read: the read below never answers in time.
    openBoard(fake, lang);
    assert.equal(message(fake), lang.highScores.board.reading);
    assert.deepEqual(crowns(fake), { left: null, middle: null, right: null });
    press(fake, "Exit");
    fake.advanceTime(BOARD_OPEN_MS);

    setBoard(MEDIEVAL, board(["SLL", "52000000"]));
    await play(MEDIEVAL, { after: board(["SLL", "52000000"], ["BOB", "40000000"]) });
    switchTo("Alice");
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["BOB", "40000000"]) });

    openBoard(fake, lang);
    assert.deepEqual(crowns(fake), { left: crowned("crown_silver.png"), middle: crowned("crown_gold.png"), right: null });
});
