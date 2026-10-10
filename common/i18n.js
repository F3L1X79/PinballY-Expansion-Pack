// ============================================================
// Shared language selection for all project-owned UI text.
// Translation can be disabled globally, in which case English is used.
// Any key missing from the selected language falls back to its English
// text (per key, recursively); tests/project/lang_keys.test.js keeps every key in
// every language. No side effects.
// ============================================================

import de from "../lang/de.js";
import en from "../lang/en.js";
import es from "../lang/es.js";
import fr from "../lang/fr.js";
import it from "../lang/it.js";
import pt from "../lang/pt.js";
import config from "./config.js";

const AVAILABLE_LANGUAGES = {
    de,
    en,
    es,
    fr,
    it,
    pt,
};

const DEFAULT_LANGUAGE_CODE = "en";

function isSection(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Only fills in keys the language lacks and never overrides present ones, so
// translation maps keyed by English source text (empty in en.js) keep their own entries.
export function withFallback(language, fallback) {
    const merged = { ...language };
    for (const key of Object.keys(fallback)) {
        const own = Object.prototype.hasOwnProperty.call(language, key) ? language[key] : undefined;
        if (own === undefined) {
            merged[key] = fallback[key];
        } else if (isSection(own) && isSection(fallback[key])) {
            merged[key] = withFallback(own, fallback[key]);
        }
    }
    return merged;
}

const activeLanguageCode = String(config.language || DEFAULT_LANGUAGE_CODE).toLowerCase();

const activeLanguageCodeResolved = AVAILABLE_LANGUAGES[activeLanguageCode]
    ? activeLanguageCode
    : DEFAULT_LANGUAGE_CODE;

const englishTexts = AVAILABLE_LANGUAGES[DEFAULT_LANGUAGE_CODE];

export const activeLanguage = activeLanguageCodeResolved === DEFAULT_LANGUAGE_CODE
    ? englishTexts
    : withFallback(AVAILABLE_LANGUAGES[activeLanguageCodeResolved], englishTexts);

export default activeLanguage;
