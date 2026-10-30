// ============================================================
// Script Reader state: the small git-ignored JSON file in the pack folder
// that remembers the installed vpxtool's version, answered by its --version
// at an earlier start, and what the pack offers against the Script Reader Version.
// Read once when created; kept through a Pack Update.
// - An unreadable file (cut by a crash) is logged, deleted, and read as no version.
// - An unreadable --version answer forgets the version: nothing is offered on a guess.
// ============================================================

import { createPinballYHost } from "../core/pinbally_host.js";
import { logError } from "../core/error_log.js";
import { isNewerPackVersion } from "../core/pack_version.js";
import { SCRIPT_NAME } from "./table_rom_record.js";
import { SCRIPT_READER_VERSION } from "./script_reader_version.js";

export const SCRIPT_READER_STATE_FILE_NAME = "script_reader.json";
const FORMAT_VERSION = 1;
// vpxtool's git_version! answers "vpxtool git:v0.38.0", "vpxtool cargo:0.38.0" or "vpxtool unknown".
const VERSION_IN_OUTPUT = /(\d+\.\d+\.\d+)/;

export function createScriptReaderState(host) {
    const path = `${host.getProjectFolder()}\\${SCRIPT_READER_STATE_FILE_NAME}`;
    const vpxtoolPath = `${host.getProjectFolder()}\\tools\\vpxtool.exe`;

    function load() {
        if (!host.files.fileExists(path)) return null;
        try {
            const saved = JSON.parse(host.files.readText(path));
            if (!saved || typeof saved !== "object" || typeof saved.vpxtoolVersion !== "string") throw new Error("no vpxtool version");
            return saved;
        } catch (error) {
            logError(SCRIPT_NAME, `ERROR reading ${SCRIPT_READER_STATE_FILE_NAME}, deleted: ${error.message}`, host, error);
            host.files.deleteFile(path);
            return null;
        }
    }

    let saved = load();

    const installedVersion = () => (saved ? saved.vpxtoolVersion : null);

    function rememberVersion(version) {
        if (version === installedVersion()) return;
        saved = { vpxtoolVersion: version, version: FORMAT_VERSION };
        host.files.writeText(path, JSON.stringify(saved));
    }

    function versionUnreadable(reason) {
        logError(SCRIPT_NAME, `ERROR vpxtool's version unreadable: ${reason}; no install or update offered.`, host);
        saved = null;
        if (host.files.fileExists(path)) host.files.deleteFile(path);
    }

    return {
        rememberVersion,
        versionUnreadable,
        // The answer of a "vpxtool --version" run, { exitCode, output }: its first X.Y.Z.
        applyVersionAnswer: ({ exitCode, output }) => {
            if (exitCode !== 0) {
                versionUnreadable(`vpxtool --version exit code ${exitCode}`);
                return;
            }
            const match = VERSION_IN_OUTPUT.exec(output);
            if (match) rememberVersion(match[1]);
            else versionUnreadable(`no version in "${output.trim()}"`);
        },
        // Against release: { kind: "install" } while vpxtool is missing,
        // { kind: "update", installed } while older, { kind: "upToDate",
        // installed } while equal or newer, null while its version is unknown.
        offer: (release = SCRIPT_READER_VERSION) => {
            if (!host.files.fileExists(vpxtoolPath)) return { kind: "install" };
            const installed = installedVersion();
            if (!installed) return null;
            // Plain X.Y.Z, compared as Pack Versions are.
            return { kind: isNewerPackVersion(release.version, installed) ? "update" : "upToDate", installed };
        },
    };
}

let sharedState = null;

export function getScriptReaderState() {
    if (!sharedState) sharedState = createScriptReaderState(createPinballYHost());
    return sharedState;
}
