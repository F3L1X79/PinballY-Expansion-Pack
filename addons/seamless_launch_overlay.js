// ============================================================
// Hides the wheel while a table launches and closes, showing the Loader and
// the current step beneath it instead of PinballY's launch message, to avoid
// a black flash before the table's own loading screen. Listens to
// "launchoverlayshow", "launchoverlaymessage" and "launchoverlayhide".
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import { createLoader } from "../common/drawing/loader.js";
import lang from "../common/core/i18n.js";

const SCRIPT_NAME = "SeamlessLaunchOverlay";

// PinballY draws the launch overlay above every layer and its own layers
// cannot be resized, so the Loader is a layer just under it, seen through
// its nearly clear background; below the menus (6000 and up), such as a
// game's pause menu.
const LOADER_Z_INDEX = 5999;

const STEP_TEXT = lang.launchSteps;

export default function init() {
    const host = createPinballYHost();
    const loader = createLoader(host, { zIndex: LOADER_Z_INDEX, caption: STEP_TEXT.loading });

    // Fires when the launch overlay appears: hides the wheel and replaces the
    // default overlay background (preventDefault suppresses PinballY's own).
    host.on("launchoverlayshow", safeHandler(SCRIPT_NAME, ev => {
        host.showWheel(false);
        host.setUnderlay("");
        host.getLaunchOverlayBackground().clear(0x20FF00FF);
        ev.preventDefault();
        loader.show();
    }));

    // Fires at each step of a launch; preventDefault suppresses PinballY's
    // text and the table's wheel icon. The overlay stays up while the game
    // runs, so the comet and its words stop once the game plays and come
    // back while it closes, unchanged until the overlay goes; a launch that
    // never plays keeps them until then. A capture is named only while the
    // comet shows, never over a game being played. Exit Game sends
    // "terminating" and skips "gameover"; a table that closes on its own, or
    // after a capture, sends only "gameover".
    host.on("launchoverlaymessage", safeHandler(SCRIPT_NAME, ev => {
        ev.preventDefault();
        if (ev.id === "running") loader.hide();
        if (ev.id === "terminating" || ev.id === "gameover") loader.show(STEP_TEXT.closing);
        if (ev.id === "capturing" && loader.isShown()) loader.show(STEP_TEXT.capturing);
    }));

    host.on("launchoverlayhide", safeHandler(SCRIPT_NAME, () => {
        host.showWheel(true);
        loader.hide();
    }));
}
