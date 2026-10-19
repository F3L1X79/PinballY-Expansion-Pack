// ============================================================
// Table ROMs confirmed by a Play without vpxtool: exactly one changed .nv
// gives the ROM, written into an empty field before later Add-ons handle
// "postlaunch"; a hand-typed ROM is never changed; zero or several write nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startTableRoms, table, vpxFile } from "./table_roms_scenario.js";

const AFM = "Attack from Mars (Bally 1995)";
const HAND_TYPED = "Attack from Mars Remix (VPX Community 2024)";
const MEDIEVAL = "Medieval Madness (Williams 1997)";
const SHORT_GAME = "Black Knight (Williams 1980)";
const NOTHING_SAVED = "Fish Tales (Williams 1992)";
const SEVERAL_SAVED = "Twilight Zone (Bally 1993)";
const NO_FILE = "No File (Williams 1990)";
const TABLES = [AFM, HAND_TYPED, MEDIEVAL, SHORT_GAME, NOTHING_SAVED, SEVERAL_SAVED];

test("the one .nv a Play changed fills the empty ROM field at once, never a hand-typed one", async () => {
    const { play, roms, log, record } = await startTableRoms({
        tables: [
            table(AFM), table(HAND_TYPED, { rom: "afm_11" }), table(MEDIEVAL, { rom: "mm_109c" }),
            table(SHORT_GAME), table(NOTHING_SAVED), table(SEVERAL_SAVED), table(NO_FILE),
        ],
        files: Object.fromEntries(TABLES.map(configId => [vpxFile(configId), {}])),
        nvFiles: ["afm_113", "mm_109c", "bk_l4", "fh_l9", "tz_94ch"],
    });
    // As an Add-on registered after Table ROMs, such as the High Scores.
    const romsSeenAfterGame = [];
    globalThis.mainWindow.on("postlaunch", (ev) => { romsSeenAfterGame.push(ev.game.rom || ""); });

    await play(AFM, { nvWritten: ["afm_113"] });
    await play(HAND_TYPED, { nvWritten: ["afm_113b"] });
    await play(MEDIEVAL, { nvWritten: ["mm_109c"] });
    await play(SHORT_GAME, { nvWritten: ["bk_l4"], durationMs: 20 * 1000 });
    await play(NOTHING_SAVED);
    await play(SEVERAL_SAVED, { nvWritten: ["tz_94ch", "fh_l9"] });
    // A table whose game file is missing is left alone.
    await play(NO_FILE, { nvWritten: ["nofile_l1"] });

    assert.deepEqual(roms(), {
        [AFM]: "afm_113",
        [HAND_TYPED]: "afm_11",
        [MEDIEVAL]: "mm_109c",
        [SHORT_GAME]: "bk_l4",
        [NOTHING_SAVED]: "",
        [SEVERAL_SAVED]: "",
        [NO_FILE]: "",
    });
    assert.deepEqual(romsSeenAfterGame, ["afm_113", "afm_11", "mm_109c", "bk_l4", "", "", ""]);
    assert.deepEqual(log().filter(line => !line.includes("vpxtool not found")), [
        `[TableRoms] "${AFM}": ROM "afm_113" written (was empty; source: nv).`,
        `[TableRoms] "${HAND_TYPED}": hand-typed ROM "afm_11" kept; the .nv gives "afm_113b".`,
        `[TableRoms] "${SHORT_GAME}": ROM "bk_l4" written (was empty; source: nv).`,
        `[TableRoms] "${SEVERAL_SAVED}": several .nv files changed during the game (fh_l9.nv, tz_94ch.nv); no ROM confirmed.`,
    ]);
    assert.deepEqual(record().tables, {
        [AFM]: { written: { rom: "afm_113", source: "nv" } },
        [SHORT_GAME]: { written: { rom: "bk_l4", source: "nv" } },
    });
});
