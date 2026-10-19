// ============================================================
// Table ROMs: fills PinballY's ROM field of each VPX table silently, from
// the table script read by tools\vpxtool.exe, one table at a time, never
// during a game. After each game, the .nv file VPinMAME wrote confirms the
// ROM. Writes table_roms.json next to cabinet.json, and logfile.log.
// - Never overwrites a ROM typed by hand.
// - The confirmation is written in "postlaunch" so later Add-ons see it.
// ============================================================

import { createPinballYHost } from "../common/core/pinbally_host.js";
import { safeHandler } from "../common/core/safe_handler.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { createTableRomRecord, SCRIPT_NAME } from "../common/table_roms/table_rom_record.js";
import { createScriptQueue } from "../common/table_roms/script_queue.js";
import { createNvConfirmation } from "../common/table_roms/nv_confirmation.js";

// Leaves PinballY's own startup work (videos, first wheel draw) alone.
const STARTUP_DELAY_MS = 10 * 1000;

export default function init() {
    const host = createPinballYHost();
    const record = createTableRomRecord(host, getProfileStore());
    const queue = createScriptQueue(host, record);
    createNvConfirmation(host, record);
    host.setTimeout(safeHandler(SCRIPT_NAME, queue.start), STARTUP_DELAY_MS);
}
