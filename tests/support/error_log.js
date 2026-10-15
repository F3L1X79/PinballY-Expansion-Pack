// ============================================================
// The errors a test run logged on the fake PinballY host: the log lines
// holding "ERROR", as safeHandler writes them, and the check that a
// scenario logged none. Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";

export const errorLines = fake => fake.logLines().filter(line => line.includes("ERROR"));

// message: why no error is expected, when the scenario needs saying it.
export function assertNoErrorLogged(fake, message) {
    assert.deepEqual(errorLines(fake), [], message);
}
