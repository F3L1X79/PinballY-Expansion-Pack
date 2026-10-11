// ============================================================
// World Tour tracker: keeps in memory only the tables the player selected
// on PinballY's "All Tables" filter, in wheel mode, in one go. The table
// selected when the tour starts counts as seen. Listens to the game list's
// "gameselect", which the add-ons' own wheel moves (setWheelGame) never
// fire. The tour starts over on a launch ("gamestarted"), a filter change
// ("filterselect"), a Profile switch, attract mode ("attractmodestart") and
// a change in the wheel's contents (a settings reload, a refreshed filter);
// a tour waiting for its starting table takes it back on the wheel
// ("wheelmode"), or on the next tick after a filter change or a reload.
// When every table of the wheel the active Profile sees (at least two)
// has been seen, sets that Profile's worldTour flag in its profile.json
// and calls onCompleted, once per tour.
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { ALL_TABLES_FILTER } from "../core/pinbally_host.js";

const SCRIPT_NAME = "WorldTour";
// A single table is no tour.
const MIN_WHEEL_TABLES = 2;

// Equal for two wheels with the same tables, whatever the current one.
const signatureOf = wheel => wheel.map(table => table.configId).sort().join("\n");

export function createWorldTour(host, profileStore, { onCompleted }) {
    const seenConfigIds = new Set();
    // The wheel's signature when the tour started; null while the tour
    // waits for its starting table.
    let tourWheelSignature = null;
    let isCompleted = false;

    const isOnAllTablesWheel = () => host.getCurrentFilterId() === ALL_TABLES_FILTER && host.getUIMode() === "wheel";

    function startOver() {
        seenConfigIds.clear();
        tourWheelSignature = null;
        isCompleted = false;
    }

    function startFrom(game, wheel) {
        startOver();
        seenConfigIds.add(game.configId);
        tourWheelSignature = signatureOf(wheel);
    }

    function startIfWaiting() {
        if (tourWheelSignature !== null || !isOnAllTablesWheel()) return;
        const wheel = host.getWheelTables();
        if (wheel[0]) startFrom(wheel[0], wheel);
    }

    const safeStartIfWaiting = safeHandler(SCRIPT_NAME, startIfWaiting);

    // Starts over from the current table when it can count at once.
    function restart() {
        startOver();
        startIfWaiting();
    }

    // Starts over from the current table once PinballY has applied the
    // change: the event fires before it, and no "wheelmode" follows when the
    // player changes filter straight from the wheel.
    function restartNextTick() {
        startOver();
        host.setTimeout(safeStartIfWaiting, 0);
    }

    function recordSelection(game) {
        if (!game || !isOnAllTablesWheel()) return;
        // Read afresh: the metafilters keep Hidden tables, and Adult Tables
        // for a Child Profile, off this wheel. A refreshed filter can change
        // its contents without any event: the tour then starts over here.
        const wheel = host.getWheelTables();
        if (signatureOf(wheel) === tourWheelSignature) seenConfigIds.add(game.configId);
        else startFrom(game, wheel);
        if (isCompleted || wheel.length < MIN_WHEEL_TABLES || !wheel.every(table => seenConfigIds.has(table.configId))) return;
        isCompleted = true;
        profileStore.updateProfileData(data => { data.worldTour = true; });
        onCompleted();
    }

    startIfWaiting();

    // Fires after the player moved the wheel to another table.
    host.onGameListEvent("gameselect", safeHandler(SCRIPT_NAME, ev => recordSelection(ev.game)));
    // Fires before the new filter is in effect.
    host.onGameListEvent("filterselect", safeHandler(SCRIPT_NAME, restartNextTick));
    // Fires once the launched table's window opened.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, startOver));
    // Fires when the cabinet, left idle, starts moving the wheel by itself.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, startOver));
    // Fires on the return to the wheel from a menu, a popup, attract mode or a game.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, startIfWaiting));
    // Fires on every Profile switch.
    profileStore.onSwitch(safeHandler(SCRIPT_NAME, restart));
    // Fires when PinballY reloads its settings, which reloads its game list.
    host.onSettingsEvent("settingsreload", safeHandler(SCRIPT_NAME, restartNextTick));
}
