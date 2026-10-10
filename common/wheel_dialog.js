// ============================================================
// Wheel dialog module: add-ons submit a dialog description (menu id,
// message, buttons with optional actions, priority) and it shows them one
// at a time, only when the wheel is free, highest priority first, so the
// add-on order in main.js never decides which dialog comes first. It owns
// the dialog layout, the button commands and their dispatch, and advances
// the queue on "menuclose", whether the dialog was acknowledged or
// dismissed; tells whether any dialog is on screen or waiting. A drawn
// dialog (see docs/adr/0011) draws itself when its turn comes and holds the
// queue until it reports closed; listeners hear it close, so toasts can
// wait for it from its submission on. A dialog not ready yet holds its
// place, and every dialog after it, until it is; a stale one is dropped
// unshown. Listens to "command", "menuclose" and "wheelmode".
// ============================================================

import { safeHandler, logHandlerError } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";

const SCRIPT_NAME = "WheelDialog";

// Lower is shown first.
export const DIALOG_PRIORITY = Object.freeze({
    STARTUP_PROMPT: 0,
    REWARD_PROMPT: 1,
    RATING_PROMPT: 2,
});

export function createWheelDialogs(host) {
    // Waiting dialogs, sorted by priority, then submission order.
    const queue = [];
    // Dialog on screen, with the command of each of its buttons.
    let shown = null;
    // Only one dialog is on screen at a time, so button commands are reused
    // from dialog to dialog; the pool only grows when a dialog needs more
    // buttons than any before it, since command IDs are finite.
    const buttonCommands = [];
    const drawnClosedListeners = [];

    function getButtonCommand(index) {
        while (buttonCommands.length <= index) {
            buttonCommands.push(host.allocateCommand(`wheelDialogButton${buttonCommands.length}`));
        }
        return buttonCommands[index];
    }

    let showScheduled = false;

    const isLive = dialog => !(dialog.isStale && dialog.isStale());

    function showNext() {
        showScheduled = false;
        for (let index = queue.length - 1; index >= 0; index--) if (!isLive(queue[index])) queue.splice(index, 1);
        if (shown || queue.length === 0) return;
        // A dialog opened while a game is exiting would sit under the launch
        // overlay, and one opened over another menu would replace it.
        if (host.getUIMode() !== "wheel") return;
        // Whatever it waits for must not wait for this queue in turn: a
        // drawn dialog queued behind it would hold the toasts it waits on.
        if (queue[0].isReady && !queue[0].isReady()) return;

        const dialog = queue.shift();
        if (dialog.open) {
            openDrawn(dialog);
            return;
        }
        const buttons = dialog.buttons.map((button, index) => ({ ...button, cmd: getButtonCommand(index) }));
        shown = { dialog, buttons };

        host.showMenu(
            dialog.id,
            [
                { title: dialog.message, cmd: -1 },
                { cmd: -1 },
                ...buttons.map(({ label, cmd }) => ({ title: label, cmd })),
            ],
            { dialogStyle: true }
        );
        if (dialog.onShown) dialog.onShown();
    }

    function openDrawn(dialog) {
        const current = { dialog, drawn: true };
        shown = current;
        // Ignores a second call, and a call from a dialog no longer on screen.
        const close = () => {
            if (shown !== current) return;
            shown = null;
            for (const listener of drawnClosedListeners) listener();
            scheduleShowNext();
        };
        try {
            dialog.open(close);
        } catch (error) {
            // A dialog that cannot open must not hold the queue forever.
            logHandlerError(SCRIPT_NAME, error);
            close();
        }
    }

    // Shows the next dialog one tick later, so every dialog submitted in the
    // meantime competes on priority, such as those of all the add-ons' init
    // at startup.
    function scheduleShowNext() {
        if (showScheduled) return;
        showScheduled = true;
        setTimeout(safeHandler(SCRIPT_NAME, showNext), 0);
    }

    // dialog: either a native one { id, message, buttons, priority, onShown },
    // or a drawn one { priority, open(close) }, open drawing it and close
    // to be called once it is gone. Either may add isReady (optional: the
    // queue waits on it while it returns false; wake() once it may be ready)
    // and isStale (optional: dropped unshown when it returns true at its turn).
    function submit(dialog) {
        const insertAt = queue.findIndex(queued => queued.priority > dialog.priority);
        if (insertAt === -1) queue.push(dialog);
        else queue.splice(insertAt, 0, dialog);
        scheduleShowNext();
    }

    // Fires on every command. PinballY closes the menu after the command,
    // so the queue advances on "menuclose", not here. Async because an
    // action may animate the wheel, so its rejections are logged too.
    host.on("command", safeHandler(SCRIPT_NAME, async ev => {
        if (!shown || shown.drawn) return;
        const button = shown.buttons.find(item => item.cmd === ev.id);
        if (button && button.action) await button.action();
    }));

    // Fires after any menu closes; the button and Escape both close the dialog.
    host.on("menuclose", safeHandler(SCRIPT_NAME, ev => {
        if (!shown || shown.drawn || ev.id !== shown.dialog.id) return;
        shown = null;
        scheduleShowNext();
    }));

    // Fires on every return to the wheel (from a game, a menu or a popup).
    host.on("wheelmode", safeHandler(SCRIPT_NAME, scheduleShowNext));

    // True when no dialog is on screen or waiting, so an add-on drawing over
    // the wheel knows it would not cover one.
    const isIdle = () => !shown && !queue.some(isLive);

    // True while a drawn dialog is on screen or waiting its turn: toasts
    // and Confetti Showers wait for it to close instead of drawing over it,
    // and must not start in the tick before it opens.
    const hasDrawnDialog = () => Boolean(shown && shown.drawn) || queue.some(dialog => dialog.open);

    // listener: runs, guarded, each time a drawn dialog closes.
    function onDrawnDialogClosed(listener) {
        drawnClosedListeners.push(safeHandler(SCRIPT_NAME, listener));
    }

    return { submit, wake: scheduleShowNext, isIdle, hasDrawnDialog, onDrawnDialogClosed };
}

let sharedWheelDialogs = null;

// One queue for every add-on, so their dialogs never replace each other.
export function getWheelDialogs() {
    if (!sharedWheelDialogs) sharedWheelDialogs = createWheelDialogs(createPinballYHost());
    return sharedWheelDialogs;
}
