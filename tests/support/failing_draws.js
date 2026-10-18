// ============================================================
// Makes every text drawn through PinballY's StyledText throw while run()
// runs, as DirectWrite failing would: a screen drawing then fails part
// way, its error logged with "ERROR" (read with errorLines(fake)).
// Restores StyledText afterwards, even when run() throws. Never loaded by
// PinballY.
// ============================================================

export const FAILING_DRAW_MESSAGE = "DirectWrite is gone";

export function whileDrawsFail(run) {
    const RealStyledText = globalThis.StyledText;
    globalThis.StyledText = class {
        constructor() { throw new Error(FAILING_DRAW_MESSAGE); }
    };
    try {
        return run();
    } finally {
        globalThis.StyledText = RealStyledText;
    }
}
