// ============================================================
// Table ROMs: fills PinballY's ROM field of each Visual Pinball X table by
// itself, silently (its only output is logfile.log). A little after
// startup, the tables never read or whose file changed have their script
// read by vpxtool (tools\vpxtool.exe), hidden, one at a time, never while
// a game runs; the ROM found goes into an empty field or one the Add-on
// filled itself, never over a hand-typed one. Its record is
// table_roms.json, next to cabinet.json.
// ============================================================

import { createPinballYHost } from "../common/core/pinbally_host.js";
import { safeHandler } from "../common/core/safe_handler.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { createTableRomRecord, SCRIPT_NAME } from "../common/table_roms/table_rom_record.js";
import { createScriptQueue } from "../common/table_roms/script_queue.js";

// Leaves PinballY's own startup work (videos, first wheel draw) alone.
const STARTUP_DELAY_MS = 10 * 1000;

export default function init() {
    const host = createPinballYHost();
    const queue = createScriptQueue(host, createTableRomRecord(host, getProfileStore()));
    host.setTimeout(safeHandler(SCRIPT_NAME, queue.start), STARTUP_DELAY_MS);
}
