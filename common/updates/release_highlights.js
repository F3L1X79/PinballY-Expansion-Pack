// ============================================================
// Release Highlights selection: the sentences the Pack Update success dialog
// lists under its line, from the releaseHighlights group of the language
// files (one to three sentences per Pack Version, never pruned). No side effects.
// - Without a previous Pack Version recorded (an update asked by an older pack), nothing counts as skipped.
// ============================================================

import { isNewerPackVersion } from "../core/pack_version.js";

const MAX_SENTENCES = 5;

// Every Pack Version newer than previousVersion and not newer than
// runningVersion, newest first; past five sentences, the oldest are dropped.
export function selectReleaseHighlights({ previousVersion, runningVersion, releaseHighlights }) {
    const isShown = version => (previousVersion
        ? isNewerPackVersion(version, previousVersion) && !isNewerPackVersion(version, runningVersion)
        : version === runningVersion);
    return Object.keys(releaseHighlights || {})
        .filter(isShown)
        .sort((a, b) => (isNewerPackVersion(a, b) ? -1 : 1))
        .flatMap(version => releaseHighlights[version])
        .slice(0, MAX_SENTENCES);
}
