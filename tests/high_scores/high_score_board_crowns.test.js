// ============================================================
// High Score Board crowns: Gold, Silver and Bronze over the podium's steps,
// none over the rows; drawn ahead once, kept hidden and shrunk while the
// board is closed, only placed on each opening.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL, avatarFiles } from "./high_scores_scenario.js";
import { openBoard, press, crowns, crowned, crownsWaitHidden, crownDrawCounts, BOARD_OPEN_MS } from "./high_score_board_reader.js";
import { AVATAR_FRAME_IMAGES } from "../mastery/mastery_bar_scenario.js";

test("Gold, Silver and Bronze crowns over the podium, drawn ahead once and only placed on each opening", async () => {
    const { fake, setBoard, play, switchTo } = await startHighScores({
        addOns: ["highScores", "tableMastery"],
        profiles: { Alice: { collectionTier: 3, avatarFrame: 2 }, Bob: { collectionTier: 4, avatarFrame: 4 }, Carol: {} },
        active: "Carol",
        files: { ...avatarFiles("Alice", "Bob", "Carol"), ...Object.fromEntries(AVATAR_FRAME_IMAGES.map(file => [file, "png"])) },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: board(["CAR", "53000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    switchTo("Bob");
    await play(MEDIEVAL, { after: board(["BOB", "54000000"], ["CAR", "53000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    switchTo("Alice");
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["BOB", "54000000"], ["CAR", "53000000"], ["SLL", "52000000"], ["BRE", "40000000"]) });
    // Idle, so the drawing ahead runs.
    fake.advanceTime(5000);
    assert.ok(crownsWaitHidden(fake));

    fake.setLayoutSize({ width: 1080, height: 1920 });
    openBoard(fake, lang);
    const podiumCrowns = { left: crowned("crown_silver.png"), middle: crowned("crown_gold.png"), right: crowned("crown_bronze.png") };
    assert.deepEqual(crowns(fake), podiumCrowns);

    press(fake, "Exit");
    fake.advanceTime(BOARD_OPEN_MS);
    assert.ok(crownsWaitHidden(fake));

    openBoard(fake, lang);
    assert.deepEqual(crowns(fake), podiumCrowns);
    assert.deepEqual(crownDrawCounts(fake), { "crown_gold.png": 1, "crown_silver.png": 1, "crown_bronze.png": 1 });
});
