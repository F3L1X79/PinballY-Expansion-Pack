// ============================================================
// Hides the wheel and clears the underlay while a table is launching, to
// avoid a jarring black screen flash between the wheel view and the table's
// own loading screen, and shows the Loader while the table loads and again
// while it closes. Listens to "launchoverlayshow", "launchoverlaymessage"
// and "launchoverlayhide".
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import { createLoader } from "../common/drawing/loader.js";

const SCRIPT_NAME = "SeamlessLaunchOverlay";

// PinballY draws the launch overlay above every layer and its own layers
// cannot be resized, so the Loader is a layer just under it, seen through
// its nearly clear background; below the menus (6000 and up), such as a
// game's pause menu.
const LOADER_Z_INDEX = 5999;

export default function init() {
    const host = createPinballYHost();
    const loader = createLoader(host, { zIndex: LOADER_Z_INDEX });

    // Fires when the launch overlay appears: hides the wheel and replaces the
    // default overlay background (preventDefault suppresses PinballY's own).
    host.on("launchoverlayshow", safeHandler(SCRIPT_NAME, ev => {
        host.showWheel(false);
        host.setUnderlay("");
        host.getLaunchOverlayBackground().clear(0x20FF00FF);
        ev.preventDefault();
        loader.show();
    }));

    // Fires at each step of a launch. The overlay stays up while the game
    // runs, so the Loader stops once the game plays and comes back while it
    // closes; a launch that never plays keeps it until the overlay goes.
    host.on("launchoverlaymessage", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === "running") loader.hide();
        if (ev.id === "terminating") loader.show();
    }));

    host.on("launchoverlayhide", safeHandler(SCRIPT_NAME, () => {
        host.showWheel(true);
        loader.hide();
    }));
}
