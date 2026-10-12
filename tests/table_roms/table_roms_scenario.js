// ============================================================
// Shared setup for the Table ROMs tests: starts main.js on the fake
// PinballY globals with only the Table ROMs Add-on on, over tables whose
// game files, record file and fake vpxtool the test describes; then lets
// the script reading queue run, and reads back the ROM fields, the
// Add-on's log lines, its record file and the tables vpxtool read.
// ============================================================

import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";

export const NOW = new Date(2026, 9, 12, 20, 0, 0);
export const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
export const RECORD_FILE = `${PROFILES_FOLDER}\\table_roms.json`;
export const VPXTOOL = "C:\\PinballY\\Scripts\\ExpansionPack\\tools\\vpxtool.exe";
export const TABLES_FOLDER = "C:\\Visual Pinball\\Tables";
// Long enough for the queue to read every table, slow ones included.
const LONG_ENOUGH_MS = 60 * 60 * 1000;

export const vpxFile = configId => `${TABLES_FOLDER}\\${configId}.vpx`;
export const vbsFile = configId => `${TABLES_FOLDER}\\${configId}.vbs`;

// A table in PinballY's game list, its game file a .vpx by default; no
// rom when its ROM field is empty.
export function table(configId, { rom, gameFile = vpxFile(configId), isHidden = false } = {}) {
    const game = { configId, title: configId, gameFile, isHidden };
    if (rom !== undefined) game.rom = rom;
    return game;
}

// vpxtool's answer to "romname <table file>", by table file: a ROM name,
// null when the script loads no ROM, or the run itself ({ output,
// errorOutput, exitCode, durationMs }). A file it has no answer for is
// unreadable: exit code 1.
export const fakeVpxtool = answers => (args) => {
    const answer = answers[args[1]];
    if (answer === undefined) return { exitCode: 1, output: "" };
    if (answer === null) return { output: "" };
    if (typeof answer === "string") return { output: `${answer}\n` };
    return answer;
};

// files: { path: { content, modified (a date, or its ms) } } seeded before startup (table
// files, the record file); vpxtool: the fake's answers, or none when it
// is not installed.
export async function startTableRoms({ tables, files = {}, vpxtool, enabled = true }) {
    const fake = createFakePinballYHost({ now: NOW, tables });
    for (const [path, { content = "script", modified = NOW }] of Object.entries(files)) fake.addFile(path, content, { modified: new Date(modified) });
    if (vpxtool) fake.addProgram(VPXTOOL, fakeVpxtool(vpxtool));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = enabled && key === "tableRoms";

    await import("../../main.js");
    await settle();

    return {
        fake,
        readScripts: () => fake.advanceTime(LONG_ENOUGH_MS),
        // Each table's ROM field, "" when empty, hidden tables included.
        roms: () => Object.fromEntries(fake.getAllTables().map(game => [game.configId, game.rom || ""])),
        log: () => fake.logLines().filter(line => line.startsWith("[TableRoms]")),
        record: () => {
            const text = fake.readFile(RECORD_FILE);
            return text === undefined ? undefined : JSON.parse(text);
        },
        // The table files vpxtool was asked to read, in order.
        scriptsRead: () => fake.programRuns().map(run => run.args[1]),
    };
}
