// ============================================================
// The Script Reader install helper shipped in tools\ (never run here: it
// needs Windows): it takes the arguments the PinballY host passes, checks
// the digest before the swap, puts the old vpxtool.exe back on failure,
// writes its exit code last, and ships with the pack, kept by a Pack Update.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const HELPER = readFileSync(new URL("../../tools/script_reader_install.ps1", import.meta.url), "utf8");
const HOST = readFileSync(new URL("../../common/core/pinbally_host.js", import.meta.url), "utf8");
const PACK_UPDATE_HELPER = readFileSync(new URL("../../tools/pack_update.ps1", import.meta.url), "utf8");
const GITIGNORE = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8");

const position = text => {
    const index = HELPER.indexOf(text);
    assert.ok(index > 0, `the helper has ${text}`);
    return index;
};

test("takes the arguments the host passes it", () => {
    const params = /^param\((.*)\)$/m.exec(HELPER)[1];
    for (const name of ["LogFile", "OutputFile", "CodeFile", "ZipUrl", "Sha256", "Version", "ToolsFolder"]) {
        assert.ok(params.includes(`$${name}`), `the helper takes -${name}`);
        assert.ok(HOST.includes(`${name}: `), `the host passes -${name}`);
    }
});

test("downloads over TLS 1.2 within 60 s, checks the digest, then renames the old vpxtool aside before moving the new one in", () => {
    const tls = position("[Net.SecurityProtocolType]::Tls12");
    const download = position("Invoke-WebRequest -Uri $ZipUrl");
    const digest = position("if ($digest -ne $Sha256");
    const extract = position("Expand-Archive");
    const aside = position("Rename-Item -LiteralPath $current");
    const moveIn = position("Move-Item -LiteralPath $new -Destination $current");
    const version = position("& $current --version");
    assert.ok(tls < download && download < digest && digest < extract && extract < aside && aside < moveIn && moveIn < version);
    assert.ok(HELPER.includes("$DownloadTimeoutSec = 60"), "well within the pack's 90 s");
    assert.ok(HELPER.includes("-TimeoutSec $DownloadTimeoutSec"));
    assert.ok(HELPER.includes("$SwapDeadlineSec = 75"), "a slow transfer never swaps after PinballY gave up");
    assert.ok(position("-gt $SwapDeadlineSec") < aside);
    assert.ok(position("$ErrorActionPreference = 'Stop'") < aside, "a failed rename reaches the catch");
});

test("puts the old vpxtool.exe back on failure, and writes its exit code after its output", () => {
    const putBack = position("Rename-Item -LiteralPath $aside -NewName 'vpxtool.exe'");
    assert.ok(position("} catch {") < putBack);
    assert.ok(position("Set-Content -Path $OutputFile") < position("Set-Content -Path $CodeFile"), "the exit code last, as PinballY polls it");
});

test("is plain ASCII, ships with the pack, and a Pack Update replaces it while keeping vpxtool.exe", () => {
    assert.ok(/^[\x00-\x7F]*$/.test(HELPER));
    assert.ok(GITIGNORE.includes("!tools/script_reader_install.ps1"));
    assert.match(PACK_UPDATE_HELPER, /\$ShippedTools = @\([^)]*'script_reader_install\.ps1'/);
    assert.doesNotMatch(/\$ShippedTools = @\(([^)]*)\)/.exec(PACK_UPDATE_HELPER)[1], /vpxtool\.exe/);
});
