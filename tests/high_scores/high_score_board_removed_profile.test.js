// ============================================================
// The High Score Board, through main.js on the fake PinballY globals: a
// removed Profile's places show as Default Scores, without an Avatar; a
// Profile re-created under its name shows them under it again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL, PROFILES_FOLDER, avatarOf, avatarFiles } from "./high_scores_scenario.js";
import { openBoard, press, podium, BOARD_OPEN_MS } from "./high_score_board_reader.js";

test("a removed Profile's places read as Default Scores until a Profile of that name comes back", async () => {
    const { fake, setBoard, play } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", files: avatarFiles("Alice") });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    const recordOf = () => {
        openBoard(fake, lang);
        const { middle } = podium(fake, lang);
        press(fake, "Exit");
        fake.advanceTime(BOARD_OPEN_MS);
        return { name: middle.name, avatar: middle.avatar };
    };

    fake.removeFolder(`${PROFILES_FOLDER}\\Alice`);
    assert.deepEqual(recordOf(), { name: "Default score", avatar: null });

    fake.addFile(`${PROFILES_FOLDER}\\Alice\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [] }));
    fake.addFile(avatarOf("Alice"), "png");
    assert.deepEqual(recordOf(), { name: "Alice", avatar: avatarOf("Alice") });
});
