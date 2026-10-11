// ============================================================
// Change Player hook: the Profile picker Add-on registers how to open its
// carousel, so other Add-ons (the Welcome Screen) can offer "Change Player"
// without importing an Add-on. Nothing is registered when the picker is
// off. No side effects on import.
// ============================================================

let changePlayer = null;

export function registerChangePlayer(open) {
    changePlayer = open;
}

// The function that opens the Profile picker, or null when it is not running.
export function getChangePlayer() {
    return changePlayer;
}
