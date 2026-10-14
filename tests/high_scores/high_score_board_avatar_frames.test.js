// ============================================================
// The High Score Board, through main.js on the fake PinballY globals:
// each owner's Avatar wears the Avatar Frame its Profile wears (the 192 px
// image, a quarter of the Avatar's size beyond it on every side, inside
// its step or row), on the podium's 1st and 2nd steps and in the rows; a
// Profile that wears none shows its bare Avatar, a Default Score neither.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, MEDIEVAL, avatarOf, avatarFiles } from "./high_scores_scenario.js";
import { openBoard, podium, rows, frames } from "./high_score_board_reader.js";
import { AVATAR_FRAME_IMAGES } from "../mastery/mastery_bar_scenario.js";

const framed = tier => ({ tier, size: 192, isAroundAvatar: true, isInside: true });

test("each owner's Avatar wears its Profile's frame on the podium and in the rows", async () => {
    const { fake, setBoard, play, switchTo } = await startHighScores({
        addOns: ["highScores", "tableMastery"],
        profiles: {
            Alice: { collectionTier: 3, avatarFrame: 2 },
            Bob: { collectionTier: 4, avatarFrame: 4 },
            Carol: { collectionTier: 2, avatarFrame: 1 },
            Dave: { collectionTier: 2, avatarFrame: null },
        },
        active: "Carol",
        files: { ...avatarFiles("Alice", "Bob", "Carol", "Dave"), ...Object.fromEntries(AVATAR_FRAME_IMAGES.map(file => [file, "png"])) },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, board(["SLL", "50000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"], ["XYZ", "5000000"]));
    await play(MEDIEVAL, { after: board(["CAR", "60000000"], ["SLL", "50000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]) });
    switchTo("Dave");
    await play(MEDIEVAL, { after: board(["CAR", "60000000"], ["SLL", "50000000"], ["DAV", "42000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    switchTo("Bob");
    await play(MEDIEVAL, { after: board(["CAR", "60000000"], ["SLL", "50000000"], ["BOB", "45000000"], ["DAV", "42000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    switchTo("Alice");
    await play(MEDIEVAL, { after: board(["ALI", "70000000"], ["CAR", "60000000"], ["SLL", "50000000"], ["BOB", "45000000"], ["DAV", "42000000"], ["BRE", "40000000"]) });

    // A portrait window, as the cabinet's: every row in view, none scrolled out.
    fake.setLayoutSize({ width: 1080, height: 1920 });
    openBoard(fake, lang);
    const owners = places => places.map(place => place && { name: place.name, avatar: place.avatar });
    const { left, middle, right } = podium(fake, lang);
    assert.deepEqual(owners([left, middle, right]), [
        { name: "Carol", avatar: avatarOf("Carol") }, { name: "Alice", avatar: avatarOf("Alice") }, { name: lang.highScores.board.defaultScore, avatar: null },
    ]);
    assert.deepEqual(owners(rows(fake, lang)), [
        { name: "Bob", avatar: avatarOf("Bob") }, { name: "Dave", avatar: avatarOf("Dave") }, { name: lang.highScores.board.defaultScore, avatar: null },
    ]);
    assert.deepEqual(frames(fake), {
        podium: { left: framed(1), middle: framed(2), right: null },
        rows: [framed(4), null, null],
    });
});
