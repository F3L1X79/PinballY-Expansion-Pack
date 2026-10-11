// ============================================================
// Translates PinballY's native menu titles (fixed labels, plus dynamically
// built ones matched by DYNAMIC_TITLE_RULES) and launch-overlay status
// messages into the active project language. Listens to "menuopen" and
// "launchoverlaymessage"; logs untranslated titles when
// logUntranslatedMenuTitles is on in common/core/config.js.
// ============================================================

import lang from "../common/core/i18n.js";
import { safeHandler } from "../common/core/safe_handler.js";
import config from "../common/core/config.js";

const SCRIPT_NAME = "UITranslation";

// Menu scroll indicators to ignore silently (never logged as missing).
const IGNORED_SCROLL_INDICATORS = ["↑", "↓"]; // ↑ ↓

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export default function init() {
    const NATIVE_MENU_LABELS = lang.nativeMenuLabels || {};
    const MEDIA_CAPTURE_ITEM_LABELS = lang.mediaCaptureItemLabels || {};
    const MEDIA_CAPTURE_ACTION_LABELS = lang.mediaCaptureActionLabels || {};
    const LAUNCH_OVERLAY_MESSAGES = lang.launchOverlayMessages || {};
    const BUILD_LABEL = lang.dynamicLabelBuilders || {};
    // Undefined when the language has no such builder. Not "?.(": PinballY's
    // ChakraCore rejects optional chaining and the whole pack fails to load.
    const buildLabel = (name, ...args) => (typeof BUILD_LABEL[name] === "function" ? BUILD_LABEL[name](...args) : undefined);

    // PinballY's own durations ("5 minutes", "An hour and 5 minutes"...),
    // inside a sentence; kept as they are when no rule matches.
    const DURATION_RULES = [
        { pattern: /^(\d+) seconds?$/, build: m => buildLabel("durationSeconds", Number(m[1])) },
        { pattern: /^(\d+) minutes?$/, build: m => buildLabel("durationMinutes", Number(m[1])) },
        { pattern: /^One hour$/, build: () => buildLabel("durationHours", 1, 0) },
        { pattern: /^An hour and (\d+) minutes$/, build: m => buildLabel("durationHours", 1, Number(m[1])) },
        { pattern: /^(\d+) hours$/, build: m => buildLabel("durationHours", Number(m[1]), 0) },
        { pattern: /^(\d+) hours and (\d+) minutes$/, build: m => buildLabel("durationHours", Number(m[1]), Number(m[2])) },
        { pattern: /^(\d+):(\d+) hours$/, build: m => buildLabel("durationHours", Number(m[1]), Number(m[2])) },
    ];
    const translateDuration = text => {
        for (const rule of DURATION_RULES) {
            const match = text.match(rule.pattern);
            if (match) return rule.build(match) ?? text;
        }
        return text;
    };

    // Rules for menu titles PinballY builds dynamically (category names, star
    // ratings, media-capture labels...), tried in order — first match wins.
    const DYNAMIC_TITLE_RULES = [
        { pattern: /^(\d+)-Star Tables$/, build: m => BUILD_LABEL.starTables ? BUILD_LABEL.starTables(m[1]) : null },
        { pattern: /^Unrated Tables$/, build: () => BUILD_LABEL.unratedTables ? BUILD_LABEL.unratedTables() : null },
        { pattern: /^(\d+)s Tables$/, build: m => BUILD_LABEL.decadeTables ? BUILD_LABEL.decadeTables(m[1]) : null },
        { pattern: /^(.+) Tables$/, build: m => BUILD_LABEL.genericTables ? BUILD_LABEL.genericTables(m[1]) : null },
        {
            pattern: /^(.+): (.+)$/,
            build: m => {
                let itemPart = m[1];
                let actionPart = m[2];

                let numberSuffix = "";
                const numberedItemMatch = itemPart.match(/^(.+) \((\d+)\)$/);
                if (numberedItemMatch) {
                    itemPart = numberedItemMatch[1];
                    numberSuffix = ` (${numberedItemMatch[2]})`;
                }

                let warningSuffix = "";
                if (actionPart.endsWith(" (!)")) {
                    actionPart = actionPart.slice(0, -4);
                    warningSuffix = " (!)";
                }

                const item = MEDIA_CAPTURE_ITEM_LABELS[itemPart];
                const action = MEDIA_CAPTURE_ACTION_LABELS[actionPart];
                return (item && action && BUILD_LABEL.captureItemAction)
                    ? BUILD_LABEL.captureItemAction(item + numberSuffix, action + warningSuffix)
                    : null;
            }
        },
        { pattern: /^Adjust Start Delay \((\d+) sec\)$/, build: m => BUILD_LABEL.startDelay ? BUILD_LABEL.startDelay(m[1]) : null },
        {
            pattern: /^Select the items you'd like to capture, then select Begin Capture\.\s+This will launch your game, capture screen images, and automatically exit the game when done\.\s+The process will take about (\d+) seconds\.\s+\(!\) means that an existing item will be replaced\.$/,
            build: m => BUILD_LABEL.captureInstructions ? BUILD_LABEL.captureInstructions(m[1]) : null,
        },
        {
            pattern: /^Select the items you'd like to capture, then select Begin Capture\.\s+This will launch your game, capture screen images, and automatically exit the game when done\.\s+The process will take about 1 minute\.\s+\(!\) means that an existing item will be replaced\.$/,
            build: () => BUILD_LABEL.captureInstructionsOneMinute ? BUILD_LABEL.captureInstructionsOneMinute() : null
        },
        {
            pattern: /^It looks like some of the media files you're adding might be intended for a different game, "(.+)"\.\s+Media files are always added to the game selected on the wheel, currently "(.+)"\.\s+Do you want to add these media items to the current game\?$/,
            build: m => BUILD_LABEL.mediaGameMismatchWarning ? BUILD_LABEL.mediaGameMismatchWarning(m[1], m[2]) : null
        },
        {
            pattern: /^It looks like some of the media files you're adding might be intended for other games: (.+)\.\s+Media files are always added to the game selected on the wheel, currently "(.+)"\.\s+Do you want to add these media items to the current game\?$/,
            build: m => BUILD_LABEL.mediaGameMismatchWarningMultiple ? BUILD_LABEL.mediaGameMismatchWarningMultiple(m[1], m[2]) : null
        },
        {
            pattern: /^The following media items are ready to be added for (.+)\.\s+Choose the items you'd like to add or replace\.$/,
            build: m => BUILD_LABEL.mediaReadyToAdd ? BUILD_LABEL.mediaReadyToAdd(m[1]) : null
        },
        {
            pattern: /^Batch Capture is ready to go!\s+(\d+) game\(s\) will be included in this process, which will take roughly (.+)\.$/,
            build: m => BUILD_LABEL.batchCaptureReady ? BUILD_LABEL.batchCaptureReady(m[1], translateDuration(m[2])) : null
        },
        {
            pattern: /^Do you really want to delete the game details for (.+)\?\s+\(This only deletes the bibliographic information, not any game files or media\.\)$/,
            build: m => BUILD_LABEL.confirmDeleteGameDetails ? BUILD_LABEL.confirmDeleteGameDetails(m[1]) : null
        },
        // Last: the "Show" command of a custom media window, named by the
        // player; PinballY's own "Show ..." items are translated above.
        { pattern: /^Show (.+)$/, build: m => BUILD_LABEL.showCustomView ? BUILD_LABEL.showCustomView(m[1]) : null },
    ];

    // The translated menu title, or the original one when no translation applies.
    function translateMenuTitle(title) {
        if (typeof title !== "string" || title.length === 0) return title;
        if (IGNORED_SCROLL_INDICATORS.includes(title)) return title;
        if (hasOwn(NATIVE_MENU_LABELS, title)) return NATIVE_MENU_LABELS[title];

        for (const rule of DYNAMIC_TITLE_RULES) {
            const match = title.match(rule.pattern);
            if (!match) continue;

            const translated = rule.build(match);
            if (translated !== null && translated !== undefined) return translated;
        }

        if (config.logUntranslatedMenuTitles) {
            const charCodes = title.split("").map(c => c.charCodeAt(0)).join(",");
            logfile.log(`[UITranslation] Missing translation: "${title}" (char codes: ${charCodes})`);
        }

        return title;
    }

    function translateMenuItems(items) {
        if (!Array.isArray(items)) return;

        items.forEach(item => {
            if (!item) return;
            if (item.title) item.title = translateMenuTitle(item.title);
            if (Array.isArray(item.submenu)) translateMenuItems(item.submenu);
        });
    }

    // Fires when any menu opens: translates every item title in place.
    mainWindow.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        translateMenuItems(ev.items);
        ev.menuUpdated = true;
    }));

    // Fires for each launch-overlay status message: replaces it with the
    // translation keyed by its language-independent id.
    mainWindow.on("launchoverlaymessage", safeHandler(SCRIPT_NAME, ev => {
        if (hasOwn(LAUNCH_OVERLAY_MESSAGES, ev.id)) {
            ev.message = LAUNCH_OVERLAY_MESSAGES[ev.id];
        }
    }));
}