// ============================================================
// Update state: the small git-ignored JSON file in the pack folder that
// remembers the newest known release between two starts (docs/adr/0018).
// Read once when created; each change writes the whole file.
// - An unreadable file (cut by a crash) is logged, deleted, and read as empty.
// ============================================================

import { createPinballYHost } from "../core/pinbally_host.js";

const LOG_PREFIX = "[UpdateCheck]";
export const UPDATE_STATE_FILE_NAME = "pack_update.json";
const FORMAT_VERSION = 1;

export function createUpdateState(host) {
    const path = `${host.getProjectFolder()}\\${UPDATE_STATE_FILE_NAME}`;

    function load() {
        if (!host.files.fileExists(path)) return null;
        try {
            const saved = JSON.parse(host.files.readText(path));
            if (!saved || typeof saved !== "object") throw new Error("not a JSON object");
            return saved;
        } catch (error) {
            host.log(`${LOG_PREFIX} ERROR reading ${UPDATE_STATE_FILE_NAME}, deleted: ${error.message}`);
            host.files.deleteFile(path);
            return null;
        }
    }

    // null while nothing was ever saved: no file is written for nothing.
    let saved = load();

    function save(next) {
        saved = { ...next, version: FORMAT_VERSION };
        host.files.writeText(path, JSON.stringify(saved));
    }

    return {
        // { packVersion, zipUrl, sha256 }, or null.
        latestRelease: () => (saved && saved.latestRelease) || null,
        rememberRelease: ({ packVersion, zipUrl, sha256 }) => save({ ...saved, latestRelease: { packVersion, zipUrl, sha256 } }),
        forgetRelease: () => {
            if (!saved || !saved.latestRelease) return;
            const { latestRelease, ...rest } = saved;
            save(rest);
        },
    };
}

let sharedUpdateState = null;

export function getUpdateState() {
    if (!sharedUpdateState) sharedUpdateState = createUpdateState(createPinballYHost());
    return sharedUpdateState;
}
