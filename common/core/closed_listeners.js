// ============================================================
// The closed listeners of a drawn screen (Drawn Menu, Profile Stats,
// Achievement List, Avatar Frame list, Household Stats): onClosed() for
// the screen's API, so that the wheel dialogs can wait for it, and tell()
// for the screen to call each time it closes. Each listener is guarded,
// its errors logged under the screen's script name.
// ============================================================

import { safeHandler } from "./safe_handler.js";

export function createClosedListeners(scriptName) {
    const listeners = [];
    return {
        // listener: runs, guarded, each time the screen closes.
        onClosed(listener) {
            listeners.push(safeHandler(scriptName, listener));
        },
        tell() {
            for (const listener of listeners) listener();
        },
    };
}
