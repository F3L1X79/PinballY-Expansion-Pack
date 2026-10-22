// ============================================================
// Rewrites one key of a .env.local text: every active KEY=value line of that
// key takes the new value, else one line is appended. Pure: no file access.
// - Comments, blank lines, other keys, BOM and each line's ending stay byte for byte.
// ============================================================

import { envKeyOf, splitEnvLine } from "../core/env_overrides.js";

// A missing file (text null) gives that one line, with Windows line endings.
export function rewriteEnvLine(text, keyPath, value) {
    const envKey = envKeyOf(keyPath);
    const newLine = `${envKey}=${value}`;
    if (text === null || text === undefined) return `${newLine}\r\n`;

    // Lines and their endings alternate, so each ending is written back as read.
    const parts = text.split(/(\r?\n)/);
    let found = false;
    for (let index = 0; index < parts.length; index += 2) {
        // Read as the override parser does, past the BOM.
        const bom = index === 0 && parts[0].startsWith("\uFEFF") ? "\uFEFF" : "";
        const split = splitEnvLine(parts[index].slice(bom.length));
        if (split === null || split.envKey !== envKey) continue;
        parts[index] = `${bom}${newLine}`;
        found = true;
    }
    if (found) return parts.join("");

    const lineEnding = text.includes("\r\n") || !text.includes("\n") ? "\r\n" : "\n";
    const body = text.replace(/^\uFEFF/, "");
    const endsLine = body === "" || text.endsWith("\n");
    return `${text}${endsLine ? "" : lineEnding}${newLine}${lineEnding}`;
}
