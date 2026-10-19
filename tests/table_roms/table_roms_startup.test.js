// ============================================================
// Table ROMs at a first startup: every VPX table with a game file is read by
// vpxtool, one at a time; empty fields get the ROM, hand-typed ones never
// change, "no ROM" is remembered, the record keeps each finding.
// - Only the last non-empty line of vpxtool's output counts.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startTableRoms, table, vpxFile } from "./table_roms_scenario.js";

const AFM = "Attack from Mars (Bally 1995)";
const TMNT = "Teenage Mutant Ninja Turtles (Data East 1991)";
const TMNT_REMIX = "TMNT Remix (VPX Community 2024)";
const TWILIGHT_ZONE = "Twilight Zone (Bally 1993)";
const MEDIEVAL = "Medieval Madness (Williams 1997)";
const SONIC = "Sonic (VPX Community 2023)";
const SPACE_TRIP = "Space Trip (VPX Community 2021)";
const FUTURE_PINBALL = "Future Table (Future Pinball 2010)";
const NO_FILE = "No File (Williams 1990)";
const HIDDEN = "Hidden Table (Gottlieb 1978)";

const TABLES = [
    table(AFM), table(TMNT), table(TMNT_REMIX),
    table(TWILIGHT_ZONE, { rom: "tz_94h" }), table(MEDIEVAL, { rom: "mm_109c" }),
    table(SONIC), table(SPACE_TRIP),
    table(FUTURE_PINBALL, { gameFile: "C:\\Future Pinball\\Tables\\Future Table.fpt" }),
    table(NO_FILE),
    table(HIDDEN, { isHidden: true }),
];
const READ_TABLES = [AFM, TMNT, TMNT_REMIX, TWILIGHT_ZONE, MEDIEVAL, SONIC, SPACE_TRIP, HIDDEN];
const MODIFIED = new Date(2026, 5, 1, 12, 0, 0);
const FILES = {
    ...Object.fromEntries(READ_TABLES.map(configId => [vpxFile(configId), { content: `script of ${configId}`, modified: MODIFIED }])),
    "C:\\Future Pinball\\Tables\\Future Table.fpt": {},
};
const VPXTOOL = {
    [vpxFile(AFM)]: "afm_113",
    [vpxFile(TMNT)]: "tmnt_104",
    [vpxFile(TMNT_REMIX)]: "tmnt_104",
    [vpxFile(TWILIGHT_ZONE)]: "tz_94ch",
    [vpxFile(MEDIEVAL)]: "mm_109c",
    [vpxFile(SONIC)]: { output: "Warning: NaN in Light12\r\n\r\nsonic_l1\r\n\r\n", errorOutput: "Warning: NaN in Ramp3" },
    [vpxFile(SPACE_TRIP)]: null,
    [vpxFile(HIDDEN)]: "hidden_l1",
};

const fileState = configId => ({ modified: MODIFIED.getTime(), size: `script of ${configId}`.length });
const read = (configId, rom) => ({ vpx: fileState(configId), vbs: null, rom });
const written = rom => ({ rom, source: "script" });

test("a first startup fills the empty ROM fields from the table scripts, and leaves hand-typed ROMs alone", async () => {
    const { readScripts, roms, log, record, scriptsRead } = await startTableRoms({ tables: TABLES, files: FILES, vpxtool: VPXTOOL });
    assert.deepEqual(scriptsRead(), [], "nothing read during startup");

    readScripts();

    assert.deepEqual(scriptsRead(), READ_TABLES.map(vpxFile), "the Visual Pinball X tables with a game file, hidden ones too, one at a time");
    assert.deepEqual(roms(), {
        [AFM]: "afm_113",
        [TMNT]: "tmnt_104",
        [TMNT_REMIX]: "tmnt_104",
        [TWILIGHT_ZONE]: "tz_94h",
        [MEDIEVAL]: "mm_109c",
        [SONIC]: "sonic_l1",
        [SPACE_TRIP]: "",
        [FUTURE_PINBALL]: "",
        [NO_FILE]: "",
        [HIDDEN]: "hidden_l1",
    });
    assert.deepEqual(log(), [
        `[TableRoms] "${AFM}": ROM "afm_113" written (was empty; source: script).`,
        `[TableRoms] "${TMNT}": ROM "tmnt_104" written (was empty; source: script).`,
        `[TableRoms] "${TMNT_REMIX}": ROM "tmnt_104" written (was empty; source: script).`,
        `[TableRoms] "${TWILIGHT_ZONE}": hand-typed ROM "tz_94h" kept; the script gives "tz_94ch".`,
        `[TableRoms] "${SONIC}": ROM "sonic_l1" written (was empty; source: script).`,
        `[TableRoms] "${SPACE_TRIP}": its script loads no ROM.`,
        `[TableRoms] "${HIDDEN}": ROM "hidden_l1" written (was empty; source: script).`,
    ]);
    assert.deepEqual(record(), {
        version: 1,
        tables: {
            [AFM]: { script: read(AFM, "afm_113"), written: written("afm_113") },
            [TMNT]: { script: read(TMNT, "tmnt_104"), written: written("tmnt_104") },
            [TMNT_REMIX]: { script: read(TMNT_REMIX, "tmnt_104"), written: written("tmnt_104") },
            [TWILIGHT_ZONE]: { script: read(TWILIGHT_ZONE, "tz_94ch") },
            [MEDIEVAL]: { script: read(MEDIEVAL, "mm_109c") },
            [SONIC]: { script: read(SONIC, "sonic_l1"), written: written("sonic_l1") },
            [SPACE_TRIP]: { script: read(SPACE_TRIP, null) },
            [HIDDEN]: { script: read(HIDDEN, "hidden_l1"), written: written("hidden_l1") },
        },
    });
});
