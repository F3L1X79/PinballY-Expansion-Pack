// ============================================================
// Opening veil: what the player sees while a screen they wait for gets
// ready (docs/adr/0014), shared by every such screen. show() dims the
// wheel at once under a veil and turns the Loader over it if the screen is
// still not ready 150 ms later; hideLoader() and
// remove() take them away. Listens to no event and writes nothing.
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { DIMMED_WHEEL } from "./steamball_drawing.js";
import { createLoader } from "./loader.js";

// A screen ready sooner shows no Loader: no flash of comet on a fast cabinet.
const LOADER_DELAY_MS = 150;

// zIndex: the veil's, just under the screen; the Loader sits right above it.
export function createOpeningVeil(host, scriptName, { zIndex }) {
    const loader = createLoader(host, { zIndex: zIndex + 1 });
    let veil = null;
    let loaderTimer = null;

    function hideLoader() {
        host.clearTimeout(loaderTimer);
        loaderTimer = null;
        loader.hide();
    }

    return {
        show() {
            // Cleared, not drawn: nothing to measure, so it shows at once.
            veil = host.createDrawingLayer(zIndex);
            veil.clear(DIMMED_WHEEL);
            loaderTimer = host.setTimeout(safeHandler(scriptName, () => {
                loaderTimer = null;
                loader.show();
            }), LOADER_DELAY_MS);
        },
        hideLoader,
        // The veil and the Loader; safe to call again.
        remove() {
            hideLoader();
            if (!veil) return;
            host.removeDrawingLayer(veil);
            veil = null;
        },
    };
}
