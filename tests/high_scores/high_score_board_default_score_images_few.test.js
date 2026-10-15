// ============================================================
// The High Score Board, through main.js on the fake PinballY globals: with
// fewer Default Score images than ten, one of them unreadable (logged),
// the Default Scores show only the readable ones, each of them used while
// one is free.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, FACTORY, MEDIEVAL, defaultScoreImageOf, defaultScoreImageFiles } from "./high_scores_scenario.js";
import { openBoard, podium, rows } from "./high_score_board_reader.js";

test("only the present and readable Default Score images show", async () => {
    const { fake, setBoard, log } = await startHighScores({ files: defaultScoreImageFiles(3, 7) });
    const { default: lang } = await import("../../common/core/i18n.js");
    fake.addUnreadableImage(defaultScoreImageOf(5));
    setBoard(MEDIEVAL, FACTORY);

    fake.setLayoutSize({ width: 1080, height: 1920 });
    openBoard(fake, lang);
    fake.advanceTime(1000);
    await settle();
    const { left, middle, right } = podium(fake, lang);
    const images = [middle, left, right, ...rows(fake, lang)].map(place => place.avatar);
    assert.equal(images.length, 5);
    assert.deepEqual([...new Set(images)].sort(), [defaultScoreImageOf(3), defaultScoreImageOf(7)]);
    assert.deepEqual(log().filter(line => line.includes("default_score_")), [
        `[HighScores] ${defaultScoreImageOf(5)} is unreadable; Default Scores show without it.`,
    ]);
});
