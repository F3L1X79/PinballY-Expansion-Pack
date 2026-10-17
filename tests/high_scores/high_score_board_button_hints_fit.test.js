// ============================================================
// The High Score Board's Button Hints in landscape and portrait windows,
// through main.js on the fake PinballY globals: on a 5-place board and a
// 10-place one, the footer sits inside the window, under the podium and
// the rows in view, hiding none of them, its words inside it; a 5-place
// board still shows both its rows at once in a landscape window.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, board, MEDIEVAL, FACTORY } from "./high_scores_scenario.js";
import { openBoard, press, rows, footerLayout } from "./high_score_board_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TEN_PLACES = board(
    ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"],
    ["DTW", "9000000"], ["CPG", "8000000"], ["JAB", "7000000"], ["MRP", "6000000"], ["KOZ", "5000000"],
);
const WINDOWS = [{ width: 1920, height: 1080 }, { width: 1080, height: 1920 }];

test("the footer fits under the podium and the rows in landscape and portrait", async () => {
    const { fake, setBoard } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    const { default: lang } = await import("../../common/core/i18n.js");

    for (const size of WINDOWS) {
        fake.setLayoutSize(size);
        for (const [name, places] of [["5 places", FACTORY], ["10 places", TEN_PLACES]]) {
            setBoard(MEDIEVAL, places);
            openBoard(fake, lang);
            await settle();
            fake.advanceTime(1000);
            await settle();
            const where = `${size.width}x${size.height}, ${name}`;
            if (places === FACTORY) assert.deepEqual(rows(fake, lang).map(row => row.initials), ["ZAP", "RCF"], `${where}: both rows in view`);
            const { footer, steps, rows: rowRects, textsInside } = footerLayout(fake, size);
            assert.ok(footer.top >= 0 && footer.bottom <= size.height && footer.left >= 0 && footer.right <= size.width, `${where}: inside the window`);
            assert.equal(steps.length, 3);
            for (const piece of [...steps, ...rowRects]) assert.ok(piece.bottom <= footer.top + 0.5, `${where}: under the podium and the rows`);
            assert.ok(textsInside, `${where}: its words inside it`);
            press(fake, "Exit");
        }
    }
    assertNoErrorLogged(fake);
});
