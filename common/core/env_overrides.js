// ============================================================
// Merges the KEY=value lines of a .env.local text into the default
// configuration. Keys are the config keys in UPPER_SNAKE_CASE (addOns
// entries take the ADD_ON_ prefix); the expected type comes from the
// default value. Pure: no file access, no logging, defaults left untouched.
// ============================================================

// Prefix of the keys of each configuration section, in the singular so a
// line reads "ADD_ON_ACHIEVEMENTS=false".
const SECTION_PREFIXES = { addOns: "ADD_ON" };

const toUpperSnake = name => name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();

// Maps every env key to where it lives in the configuration.
function buildKeyMap(defaults) {
    const keyMap = new Map();
    for (const [key, value] of Object.entries(defaults)) {
        if (value !== null && typeof value === "object") {
            const prefix = SECTION_PREFIXES[key] || toUpperSnake(key);
            for (const subKey of Object.keys(value)) {
                keyMap.set(`${prefix}_${toUpperSnake(subKey)}`, { section: key, key: subKey });
            }
        } else {
            keyMap.set(toUpperSnake(key), { section: null, key });
        }
    }
    return keyMap;
}

function stripQuotes(value) {
    const first = value[0];
    if (value.length >= 2 && (first === "\"" || first === "'") && value[value.length - 1] === first) {
        return value.slice(1, -1);
    }
    return value;
}

// Returns { ok: true, value } or { ok: false } when the text doesn't fit the default's type.
function convert(text, defaultValue) {
    switch (typeof defaultValue) {
        case "boolean": {
            const lower = text.toLowerCase();
            if (lower === "true") return { ok: true, value: true };
            if (lower === "false") return { ok: true, value: false };
            return { ok: false, expected: "true or false" };
        }
        case "number": {
            const number = Number(text);
            if (text.trim() !== "" && Number.isFinite(number)) return { ok: true, value: number };
            return { ok: false, expected: "a number" };
        }
        default:
            return { ok: true, value: text };
    }
}

export function applyEnvOverrides(defaults, text) {
    const config = { ...defaults };
    for (const [key, value] of Object.entries(defaults)) {
        if (value !== null && typeof value === "object") config[key] = { ...value };
    }

    const keyMap = buildKeyMap(defaults);
    const overridden = [];
    const problems = [];

    const lines = String(text || "").replace(/^﻿/, "").split(/\r?\n/);
    lines.forEach((rawLine, index) => {
        const line = rawLine.trim();
        const lineLabel = `line ${index + 1}`;
        if (line === "" || line.startsWith("#")) return;

        const separator = line.indexOf("=");
        if (separator <= 0) {
            problems.push(`${lineLabel}: expected KEY=value, got "${line}"`);
            return;
        }

        const envKey = line.slice(0, separator).trim();
        const target = keyMap.get(envKey);
        if (!target) {
            problems.push(`${lineLabel}: unknown key "${envKey}"`);
            return;
        }

        const owner = target.section ? config[target.section] : config;
        const rawValue = stripQuotes(line.slice(separator + 1).trim());
        const converted = convert(rawValue, owner[target.key]);
        if (!converted.ok) {
            problems.push(`${lineLabel}: invalid value "${rawValue}" for ${envKey} (expected ${converted.expected})`);
            return;
        }

        owner[target.key] = converted.value;
        if (!overridden.includes(envKey)) overridden.push(envKey);
    });

    return { config, overridden, problems };
}
