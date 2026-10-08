// ============================================================
// Wheel Arc: the pack's gold arc (assets\images\wheel_arc.png) shown as
// PinballY's underlay, under the wheel's icons. Set at startup, then put
// back on "underlaychange" each time PinballY reaches for its own default;
// a player's own underlay (media folder) or a system's underlay is kept.
// ============================================================

import { safeHandler } from "../common/safe_handler.js";
import { createPinballYHost } from "../common/pinbally_host.js";

const SCRIPT_NAME = "WheelArc";

export default function init() {
    const host = createPinballYHost();
    const wheelArcFile = `${host.getProjectFolder()}\\assets\\images\\wheel_arc.png`;
    if (!host.files.fileExists(wheelArcFile)) {
        host.log(`[${SCRIPT_NAME}] ${wheelArcFile} not found; PinballY's underlay stays.`);
        return;
    }
    // PinballY's default lives in its own Assets folder, whatever its extension.
    const pinballYDefaultPrefix = `${host.getProgramFolder().replace(/\\+$/, "")}\\Assets\\Images\\underlay.`.toLowerCase();
    const isPinballYDefault = file => !file || file.toLowerCase().startsWith(pinballYDefaultPrefix);

    // Fires when PinballY is about to switch underlays on another table;
    // left to proceed, so the arc keeps PinballY's underlay layout.
    host.on("underlaychange", safeHandler(SCRIPT_NAME, ev => {
        if (isPinballYDefault(ev.filename)) ev.filename = wheelArcFile;
    }));

    // "underlaychange" never fires for the underlay already on screen, so
    // PinballY's choice for the table selected at startup is made again here:
    // its system's underlay first, then the global one.
    const table = host.getCurrentTable();
    const systemFolder = table && table.system ? table.system.mediaDir : "";
    const systemUnderlay = systemFolder ? host.resolveGlobalImage("System Underlays", systemFolder) : undefined;
    if (!systemUnderlay && isPinballYDefault(host.resolveGlobalImage("Images", "underlay"))) host.setUnderlay(wheelArcFile);
}
