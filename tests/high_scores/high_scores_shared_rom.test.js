// ============================================================
// Two tables sharing one ROM and NVRAM, through main.js on the fake
// PinballY globals: each Play is compared with the board read at its own
// launch, so a score made on one table is never credited again on the other.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL, TABLES } from "./high_scores_scenario.js";

const REMAKE = "Medieval Madness Remake (VPX Community 2024)";

test("a score made on a table is not credited again on the table sharing its ROM", async () => {
    const { setBoard, play, switchTo, saved } = await startHighScores({
        profiles: { Alice: {}, Bob: {} }, active: "Alice",
        tables: [...TABLES, { id: 3, configId: REMAKE, title: "Medieval Madness Remake", isHidden: false, rom: "mm_109c" }],
    });
    setBoard(MEDIEVAL, boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["LFS", "30000000"]]));

    await play(MEDIEVAL);
    await play(MEDIEVAL, { after: boardLines(["SLL", "52000000"], [["ALI", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"]]) });
    switchTo("Bob");
    await play(REMAKE, { after: boardLines(["SLL", "52000000"], [["ALI", "45000000"], ["BOB", "42000000"], ["BRE", "40000000"]]) });

    assert.deepEqual(saved().highScores.map(({ profile, configId, initials }) => [profile, configId, initials]), [
        ["Alice", MEDIEVAL, "ALI"],
        ["Bob", REMAKE, "BOB"],
    ]);
});
