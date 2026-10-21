// ============================================================
// Startup veil: from the first frame the pack can show, the wheel dimmed
// as a drawn screen's backdrop dims it, with the Loader turning over it,
// while the Startup Screen is prepared. Shared by the Profile picker and
// the Welcome Screen: each hides the Loader as it shows, and the last
// startup screen hides the veil once it is in.
// - Gives way by itself to a menu, a launching table and attract mode.
// - Swallows Exit while the Loader turns: no Exit menu over a screen getting ready.
// - Cleared, not drawn: nothing measures the window, which is not laid out yet.
// - Holds the quiet wheel from before its first frame (docs/adr/0015).
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { createLoader } from "./loader.js";
import { getQuietWheel } from "../core/quiet_wheel.js";
import { DIMMED_WHEEL } from "./steamball_drawing.js";
import { WELCOME_SCREEN_Z_INDEX } from "../welcome_screen/welcome_screen_painter.js";

const SCRIPT_NAME = "StartupVeil";

// Just under the Welcome Screen's backdrop, which dims the wheel as the
// veil does, the Loader over the veil; the Profile picker's carousel shows
// far above both.
const VEIL_Z_INDEX = WELCOME_SCREEN_Z_INDEX.backdrop - 2;
const LOADER_Z_INDEX = WELCOME_SCREEN_Z_INDEX.backdrop - 1;

// show(), hideLoader(), hideVeil() and hide() are safe to call again.
export function createStartupVeil(host, quietWheel) {
    const loader = createLoader(host, { zIndex: LOADER_Z_INDEX });
    // The veil's layer, null while it is not shown.
    let veil = null;
    let isLoaderShown = false;

    function show() {
        if (!veil) {
            // Before the veil paints: the dim and the drop arrive together.
            quietWheel.hold(SCRIPT_NAME);
            veil = host.createDrawingLayer(VEIL_Z_INDEX);
            veil.clear(DIMMED_WHEEL);
        }
        loader.show();
        isLoaderShown = true;
    }

    function hideLoader() {
        loader.hide();
        isLoaderShown = false;
    }

    // atOnce: no startup screen follows, the volume comes back without the hand-over.
    function hideVeil({ atOnce = false } = {}) {
        if (!veil) return;
        host.removeDrawingLayer(veil);
        veil = null;
        quietWheel.release(SCRIPT_NAME, { atOnce });
    }

    function hide(options) {
        hideLoader();
        hideVeil(options);
    }

    // Fire when a menu opens, a table starts launching (whose overlay has
    // its own Loader) or the cabinet sits idle: the veil and the Loader
    // must not sit over them, nor the table stay lowered.
    const giveWay = () => hide({ atOnce: true });
    host.on("menuopen", safeHandler(SCRIPT_NAME, giveWay));
    host.on("launchoverlayshow", safeHandler(SCRIPT_NAME, giveWay));
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, giveWay));
    // Fires on every mapped button press: while the comet turns, no startup
    // screen takes the buttons yet, and Exit would open PinballY's Exit menu
    // over the one getting ready. Other buttons still move the wheel.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        if (isLoaderShown && ev.command === "Exit") ev.preventDefault();
    }));

    return { show, hideLoader, hideVeil, hide };
}

let sharedStartupVeil = null;

export function getStartupVeil() {
    if (!sharedStartupVeil) sharedStartupVeil = createStartupVeil(createPinballYHost(), getQuietWheel());
    return sharedStartupVeil;
}
