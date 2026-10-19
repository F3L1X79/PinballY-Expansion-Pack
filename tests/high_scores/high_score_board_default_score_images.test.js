// ============================================================
// High Score Board Default Score images: picked by initials, the same
// initials always the same image, different ones on a board never sharing
// one while one is free. A Profile's place keeps its Avatar.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, board, MEDIEVAL, AFM, avatarOf, avatarFiles, DEFAULT_SCORE_IMAGES_PATH, defaultScoreImageFiles } from "./high_scores_scenario.js";
import { openBoard, press, podium, rows, BOARD_OPEN_MS } from "./high_score_board_reader.js";

test("each Default Score shows the image of its initials, the same on every opening and every table", async () => {
    const { fake, setBoard, play } = await startHighScores({
        profiles: { Alice: {} }, active: "Alice", files: { ...avatarFiles("Alice"), ...defaultScoreImageFiles(1, 2, 3, 4, 5, 6, 7, 8, 9, 10) },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    const factory = [["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"], ["", "5000000"]];
    setBoard(MEDIEVAL, board(...factory));
    await play(MEDIEVAL, { after: board(factory[0], ["ALI", "45000000"], ...factory.slice(1)) });
    // { initials: image } of every place shown, once the fresh read ended.
    const readImages = async () => {
        openBoard(fake, lang);
        fake.advanceTime(1000);
        await settle();
        const { left, middle, right } = podium(fake, lang);
        const places = [middle, left, right, ...rows(fake, lang)];
        press(fake, "Exit");
        fake.advanceTime(BOARD_OPEN_MS);
        return Object.fromEntries(places.map(place => [place.initials, place.avatar]));
    };

    // A portrait window, as the cabinet's: every row in view, none scrolled out.
    fake.setLayoutSize({ width: 1080, height: 1920 });
    const medieval = await readImages();
    assert.equal(medieval.ALI, avatarOf("Alice"));
    const defaults = Object.entries(medieval).filter(([initials]) => initials !== "ALI");
    assert.deepEqual(defaults.map(([initials]) => initials), ["SLL", "BRE", "LFS", "ZAP", "RCF", lang.highScores.board.noInitials]);
    for (const [, image] of defaults) assert.ok(image && image.startsWith(`${DEFAULT_SCORE_IMAGES_PATH}\\default_score_`), image);
    assert.equal(new Set(defaults.map(([, image]) => image)).size, defaults.length, "different initials share an image");
    assert.deepEqual(await readImages(), medieval);

    fake.setWheelGame(1);
    // The same initials in another order, no Profile among them.
    setBoard(AFM, board(["RCF", "9000000"], ["ZAP", "8000000"], ["", "7000000"], ["SLL", "6000000"], ["LFS", "5000000"], ["BRE", "4000000"]));
    const afm = await readImages();
    const { ALI, ...defaultImages } = medieval;
    assert.deepEqual(afm, defaultImages);
});
