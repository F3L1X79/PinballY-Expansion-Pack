// ============================================================
// The High Score Board, through main.js on the fake PinballY globals:
// Guest's and a Child Profile's places show under their names and
// Avatars like any other Profile's; a board of two places leaves the 3rd
// step empty, the 1st staying in the middle.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, MEDIEVAL, avatarOf, avatarFiles } from "./high_scores_scenario.js";
import { openBoard, podium, rows } from "./high_score_board_reader.js";

test("Guest's and a Child Profile's places show under their names; with two places the 3rd step stays empty", async () => {
    const { fake, setBoard, play, switchTo } = await startHighScores({
        profiles: { Kid: { isChild: true } }, active: "Kid", files: avatarFiles("guest", "Kid"),
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, board(["SLL", "52000000"], ["BRE", "40000000"]));
    await play(MEDIEVAL, { after: board(["KID", "60000000"], ["SLL", "52000000"]) });
    switchTo("guest");
    await play(MEDIEVAL, { after: board(["KID", "60000000"], ["GST", "55000000"]) });

    openBoard(fake, lang);
    assert.deepEqual(podium(fake, lang), {
        left: { rank: "2", name: lang.profiles.guestName, avatar: avatarOf("guest"), initials: "GST", score: "55,000,000", isTableRecord: false },
        middle: { rank: "1", name: "Kid", avatar: avatarOf("Kid"), initials: "KID", score: "60,000,000", isTableRecord: true },
        right: null,
    });
    assert.deepEqual(rows(fake, lang), []);
});
