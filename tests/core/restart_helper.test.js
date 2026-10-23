// ============================================================
// The restart helper shipped in tools\ (never run here: it needs Windows
// and a live PinballY): it takes the arguments the PinballY host passes,
// and writes its ready file before waiting for PinballY to quit.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const HELPER = readFileSync(new URL("../../tools/restart_pinbally.ps1", import.meta.url), "utf8");
const HOST = readFileSync(new URL("../../common/core/pinbally_host.js", import.meta.url), "utf8");

test("takes the arguments the host passes it", () => {
    const params = /^param\((.*)\)$/m.exec(HELPER)[1];
    for (const name of ["ParentPid", "ReadyFile", "LogFile"]) {
        assert.ok(params.includes(`$${name}`), `the helper takes -${name}`);
        assert.ok(HOST.includes(`-${name} `), `the host passes -${name}`);
    }
});

test("reads PinballY's command line and writes the ready file before waiting for it to quit, up to 60 s", () => {
    const read = HELPER.indexOf("$p.CommandLine");
    const ready = HELPER.indexOf("Set-Content -Path $ReadyFile");
    const wait = HELPER.indexOf("Wait-Process -Id $ParentPid -Timeout 60");
    const start = HELPER.indexOf("Start-Process -FilePath $exe");
    assert.ok(read > 0 && read < ready && ready < wait && wait < start);
    assert.ok(HELPER.includes("'PinballY Admin Mode.exe'"), "started again through Admin Mode when that was the parent");
});

test("is plain ASCII, as Windows PowerShell reads a file without a byte order mark", () => {
    assert.ok(/^[\x00-\x7F]*$/.test(HELPER));
});
