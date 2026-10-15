// ============================================================
// Compound file reader: reads the cabinet's real VPReg.stg (copied in
// docs/research/high-scores-tools/user_folder/) into its sections and
// values, and refuses a file that is not a compound file.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readCompoundFile } from "../../common/high_scores/compound_file_reader.js";
import { writeCompoundFile } from "../support/compound_file_writer.js";

const CABINET_VPREG = new URL("../../docs/research/high-scores-tools/user_folder/VPReg.stg", import.meta.url);

test("every section of the cabinet's VPReg.stg is read, with its values as text", () => {
    const sections = readCompoundFile(new Uint8Array(readFileSync(CABINET_VPREG)));

    assert.equal(Object.keys(sections).length, 38);
    assert.equal(sections.ZELDA.HighScore1, "2800000");
    assert.equal(sections.ZELDA.HighScore1Name, "AAA");
});

test("a file that is not a compound file is refused", () => {
    assert.throws(() => readCompoundFile(new TextEncoder().encode("HighScore1=2800000\r\n")), /not a compound file/);
});

test("the test writer's files read back as written", () => {
    const sections = {
        ZELDA: { HighScore1: "2800000", HighScore1Name: "AAA" },
        LUT: { LUTset: "3" },
    };

    assert.deepEqual(readCompoundFile(writeCompoundFile(sections)), sections);
});
