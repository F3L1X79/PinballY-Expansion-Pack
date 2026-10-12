// ============================================================
// Table ROM record: the Table ROMs Add-on's memory, in table_roms.json next
// to cabinet.json (through the Profile store, so no Profile Reset touches
// it), rewritten whole on each change. Per table (by config ID): the
// state of its game file (and of the .vbs beside it) when its script was
// last read, with the ROM found or null for "no ROM"; and the ROM the
// Add-on last wrote into PinballY, with its source. A finding goes through
// the single rule of decideRomWrite(): written into PinballY's ROM field
// with the game's update(), or a disagreement logged, every write logged.
// ============================================================

const RECORD_NAME = "table_roms";
const RECORD_VERSION = 1;
// The Table ROMs Add-on's name in logfile.log, for its shared modules too.
export const SCRIPT_NAME = "TableRoms";

export const ROM_SOURCE = Object.freeze({ script: "script", nv: "nv" });
export const ROM_DECISION = Object.freeze({ write: "write", disagree: "disagree", nothing: "nothing" });

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const isEmptyRom = rom => typeof rom !== "string" || rom.trim() === "";
const sameRom = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const sameFileState = (a, b) => (a === null || b === null
    ? a === b
    : a.modified === b.modified && a.size === b.size);

// Whether a finding ({ rom, source }) goes into PinballY's ROM field
// (write), contradicts a hand-typed ROM (disagree) or changes nothing. The field is the Add-on's own when it holds the ROM the
// Add-on last wrote (written: { rom, source }, or none); a script guess
// never replaces a ROM a .nv confirmed.
export function decideRomWrite(currentRom, written, finding) {
    if (isEmptyRom(currentRom)) return ROM_DECISION.write;
    if (sameRom(currentRom, finding.rom)) return ROM_DECISION.nothing;
    if (!written || !sameRom(currentRom, written.rom)) return ROM_DECISION.disagree;
    if (finding.source === ROM_SOURCE.script && written.source === ROM_SOURCE.nv) return ROM_DECISION.nothing;
    return ROM_DECISION.write;
}

export function createTableRomRecord(host, store) {
    const log = text => host.log(`[${SCRIPT_NAME}] ${text}`);
    const saved = store.readCabinetFile(RECORD_NAME);
    const data = isRecord(saved) && isRecord(saved.tables) ? saved : { version: RECORD_VERSION, tables: {} };

    const entryOf = (configId) => {
        if (!isRecord(data.tables[configId])) data.tables[configId] = {};
        return data.tables[configId];
    };
    const save = () => store.saveCabinetFile(RECORD_NAME, data);

    function applyFinding(configId, finding) {
        const game = host.getGameInfo(configId);
        if (!game) return;
        const entry = entryOf(configId);
        const currentRom = game.rom;
        const decision = decideRomWrite(currentRom, entry.written, finding);
        if (decision === ROM_DECISION.write) {
            game.update({ rom: finding.rom });
            entry.written = { rom: finding.rom, source: finding.source };
            const was = isEmptyRom(currentRom) ? "was empty" : `was "${currentRom}"`;
            log(`"${configId}": ROM "${finding.rom}" written (${was}; source: ${finding.source}).`);
        } else if (decision === ROM_DECISION.disagree) {
            const from = finding.source === ROM_SOURCE.script ? "the script gives" : "the .nv gives";
            log(`"${configId}": hand-typed ROM "${currentRom}" kept; ${from} "${finding.rom}".`);
        }
    }

    return {
        // Whether the table's script must be read: never read, or its game
        // file or .vbs changed since (state: { vpx, vbs }, each
        // { modified, size } or null).
        needsScriptRead: (configId, state) => {
            const entry = data.tables[configId];
            const lastRead = isRecord(entry) ? entry.script : null;
            return !isRecord(lastRead) || !sameFileState(lastRead.vpx, state.vpx) || !sameFileState(lastRead.vbs, state.vbs);
        },
        // Remembers what the table's script gave (rom null: no ROM) and
        // applies it to PinballY's ROM field.
        applyScriptRead: (configId, state, rom) => {
            entryOf(configId).script = { vpx: state.vpx, vbs: state.vbs, rom };
            if (rom === null) log(`"${configId}": its script loads no ROM.`);
            else applyFinding(configId, { rom, source: ROM_SOURCE.script });
            save();
        },
    };
}
