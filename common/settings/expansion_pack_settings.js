// ============================================================
// Expansion Pack Settings: their entry in the Operator Menu, right after
// PinballY's Options, for whoever sees the setup entries; it opens the list
// of Add-on categories, each listing its Add-ons as saved in .env.local (read
// again on each opening), one page per Add-on whose Save rewrites its one line, and
// the Language page, saving at once. Listens to "menuopen", "command" and "commandbuttondown"; writes .env.local.
// - Started by main.js whatever config.addOns says, its "menuopen" listener before the Drawn Menus Add-on's.
// - Always drawn (getPackMenus), even with the Drawn Menus Add-on off.
// - Nothing applies before PinballY restarts: "on restart" marks a saved value that differs from the running one.
// - Leaving the list with such a value asks Restart now (host.restartPinballY) or Later; attract mode never asks.
// ============================================================

import lang from "../core/i18n.js";
import config, { DEFAULTS } from "../core/config.js";
import { applyEnvOverrides, envKeyOf } from "../core/env_overrides.js";
import { logHandlerError, safeHandler } from "../core/safe_handler.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { getProfileStore } from "../profiles/profile_store.js";
import { seesSetupEntries } from "../profiles/setup_entries.js";
import { getDrawnMenus, getPackMenus } from "../drawn_menu/drawn_menu.js";
import { DRAWN_MENU_Z_INDEX } from "../drawn_menu/drawn_menu_painter.js";
import { createLoader } from "../drawing/loader.js";
import { DIMMED_WHEEL } from "../drawing/steamball_drawing.js";
import { DIALOG_PRIORITY, getWheelDialogs } from "../core/wheel_dialog.js";
import { ADD_ON_GROUPS } from "./add_on_catalogue.js";
import { rewriteEnvLine } from "./env_local_rewrite.js";

const SCRIPT_NAME = "ExpansionPackSettings";
const OPERATOR_MENU_ID = "operator";
const LIST_MENU_ID = "expansionPackSettings";
const CATEGORY_MENU_ID = "expansionPackSettingsCategory";
const PAGE_MENU_ID = "expansionPackSettingsPage";
const LANGUAGE_MENU_ID = "expansionPackSettingsLanguage";
const NOT_SAVED_MENU_ID = "expansionPackSettingsNotSaved";
const RESTART_MENU_ID = "expansionPackSettingsRestart";
const RESTART_FAILED_MENU_ID = "expansionPackSettingsRestartFailed";
const SEPARATOR = { cmd: -1 };
// Just under the Drawn Menus, which the failure message may show over them.
const RESTART_VEIL_Z_INDEX = DRAWN_MENU_Z_INDEX.backdrop - 2;
const RESTART_LOADER_Z_INDEX = DRAWN_MENU_Z_INDEX.backdrop - 1;
const BOLD_WEIGHT = 700;

// getMenus: what shows the screens, asked on each opening
// (common/drawn_menu/drawn_menu.js); running: the configuration loaded at startup.
export function createExpansionPackSettings(host, profileStore, getMenus, running = config) {
    const { expansionPackSettings: TEXT } = lang;
    const entryCommand = host.allocateCommand("expansionPackSettings");
    const optionsCommand = host.getBuiltInCommand("Options");
    const operatorMenuCommand = host.getBuiltInCommand("ShowOperatorMenu");
    const menuReturnCommand = host.getBuiltInCommand("MenuReturn");
    // One command per category and per Add-on line, so that each line can be chosen.
    const groupCommands = new Map(ADD_ON_GROUPS
        .map(({ group }) => [group, host.allocateCommand(`expansionPackSettings_group_${group}`)]));
    const groupOfCommand = new Map([...groupCommands].map(([group, cmd]) => [cmd, group]));
    const groupOfAddOn = new Map(ADD_ON_GROUPS.flatMap(({ group, addOns }) => addOns.map(key => [key, group])));
    const addOnCommands = new Map([...groupOfAddOn.keys()]
        .map(key => [key, host.allocateCommand(`expansionPackSettings_${key}`)]));
    const addOnOfCommand = new Map([...addOnCommands].map(([key, cmd]) => [cmd, key]));
    const languageCommand = host.allocateCommand("expansionPackSettings_language");
    // One command per language of the Language page, in the order of languageNames.
    const languageCommands = new Map(Object.keys(TEXT.languageNames)
        .map(code => [code, host.allocateCommand(`expansionPackSettings_language_${code}`)]));
    const languageOfCommand = new Map([...languageCommands].map(([code, cmd]) => [cmd, code]));
    const switchCommand = host.allocateCommand("expansionPackSettings_switch");
    const saveCommand = host.allocateCommand("expansionPackSettings_save");
    const restartCommand = host.allocateCommand("expansionPackSettings_restart");
    const envLocalPath = `${host.getProjectFolder()}\\.env.local`;
    // The page on screen: its Add-on, the choice saved when it opened, and the switch.
    let page = null;

    const readEnvLocal = () => (host.files.fileExists(envLocalPath) ? host.files.readText(envLocalPath) : null);

    // The settings as saved now, the defaults for a missing file or key.
    const readSaved = () => applyEnvOverrides(DEFAULTS, readEnvLocal()).config;

    // Whatever its case, as i18n.js reads it.
    const languageCodeOf = language => String(language).toLowerCase();

    // A language the pack does not know shows as written.
    const languageNameOf = language => TEXT.languageNames[languageCodeOf(language)] || language;

    const stateOf = value => (value ? TEXT.on : TEXT.off);

    const addOnDiffers = (saved, key) => saved.addOns[key] !== running.addOns[key];
    const languageDiffers = saved => languageCodeOf(saved.language) !== languageCodeOf(running.language);

    // The categories, each opening its page, then the language.
    function openList(selectedCmd = null) {
        page = null;
        const saved = readSaved();
        const languageName = languageNameOf(saved.language);
        const shownLanguage = languageDiffers(saved) ? TEXT.onRestart(languageName) : languageName;
        getMenus().show(LIST_MENU_ID, [
            ...ADD_ON_GROUPS.map(({ group }) => ({ title: TEXT.groups[group], cmd: groupCommands.get(group), hasSubmenu: true })),
            SEPARATOR,
            { title: TEXT.languageLine(shownLanguage), cmd: languageCommand },
            SEPARATOR,
            { title: TEXT.back, cmd: menuReturnCommand },
        ], { selectedCmd, onBack: leaveList });
    }

    // A category's Add-ons, each On / Off as saved, under its heading.
    function openCategory(group, selectedCmd = null) {
        page = null;
        const saved = readSaved();
        const { addOns } = ADD_ON_GROUPS.find(entry => entry.group === group);
        getMenus().show(CATEGORY_MENU_ID, [
            { title: TEXT.groups[group], cmd: -1 },
            ...addOns.map((key) => {
                const state = stateOf(saved.addOns[key]);
                const shownState = addOnDiffers(saved, key) ? TEXT.onRestart(state) : state;
                return { title: TEXT.addOnLine(TEXT.addOns[key].name, shownState), cmd: addOnCommands.get(key) };
            }),
            SEPARATOR,
            { title: TEXT.back, cmd: menuReturnCommand },
        ], { selectedCmd, onBack: () => openList(groupCommands.get(group)) });
    }

    const returnToOperatorMenu = () => host.doCommand(operatorMenuCommand);

    // Back or Exit on the list: at once when nothing saved differs from what
    // runs; otherwise Restart now or Later, Exit leaving as Later does.
    function leaveList() {
        const saved = readSaved();
        if (!languageDiffers(saved) && ![...addOnCommands.keys()].some(key => addOnDiffers(saved, key))) {
            returnToOperatorMenu();
            return;
        }
        getMenus().show(RESTART_MENU_ID, [
            { title: TEXT.restartQuestion, cmd: -1 },
            SEPARATOR,
            { title: TEXT.restartNow, cmd: restartCommand },
            { title: TEXT.later, cmd: menuReturnCommand },
        ], { dialogStyle: true, onBack: returnToOperatorMenu });
    }

    // From Restart now until PinballY quits: the wheel dimmed as a drawn
    // screen's backdrop dims it, with the Loader turning over it.
    let restartVeil = null;
    const restartLoader = createLoader(host, { zIndex: RESTART_LOADER_Z_INDEX });

    function showRestartVeil() {
        restartVeil = host.createDrawingLayer(RESTART_VEIL_Z_INDEX);
        restartVeil.clear(DIMMED_WHEEL);
        restartLoader.show();
    }

    function hideRestartVeil() {
        restartLoader.hide();
        if (!restartVeil) return;
        host.removeDrawingLayer(restartVeil);
        restartVeil = null;
    }

    // Shown once the wheel is free: the failure comes up to 15 s after the
    // screens closed.
    const restartFailed = safeHandler(SCRIPT_NAME, error => {
        hideRestartVeil();
        host.log(`[${SCRIPT_NAME}] ERROR Restart not possible: ${error.message}`);
        getWheelDialogs().submit({
            id: RESTART_FAILED_MENU_ID, message: TEXT.restartFailed, buttons: [{ label: TEXT.ok }], priority: DIALOG_PRIORITY.RESTART_FAILED,
        });
    });

    function restart() {
        host.log(`[${SCRIPT_NAME}] Restart asked.`);
        showRestartVeil();
        try {
            host.restartPinballY({
                onQuitting: safeHandler(SCRIPT_NAME, () => host.log(`[${SCRIPT_NAME}] Restart helper ready, quitting.`)),
                onFailed: restartFailed,
            });
        } catch (error) {
            restartFailed(error);
        }
    }

    // Back, Exit, Cancel and Save all return to the category on the page's line.
    const backToCategory = key => openCategory(groupOfAddOn.get(key), addOnCommands.get(key));

    // Drawn with each label in bold, "When off" on a line of its own; the
    // plain title is what a native menu shows instead.
    const pageMessageRuns = (whenOn, whenOff) => [
        { text: `${TEXT.whenOnLabel} `, weight: BOLD_WEIGHT }, whenOn,
        { text: `\n${TEXT.whenOffLabel} `, weight: BOLD_WEIGHT }, whenOff,
    ];

    function showPage() {
        const { key, saved, value } = page;
        const { name, whenOn, whenOff } = TEXT.addOns[key];
        getMenus().show(PAGE_MENU_ID, [
            { title: `${TEXT.whenOnLabel} ${whenOn} ${TEXT.whenOffLabel} ${whenOff}`, runs: pageMessageRuns(whenOn, whenOff), cmd: -1 },
            SEPARATOR,
            // Stays open: the page is shown again over itself, the cursor kept.
            { title: TEXT.addOnLine(name, stateOf(value)), cmd: switchCommand, stayOpen: true },
            ...(value !== saved ? [{ title: TEXT.save, cmd: saveCommand }] : []),
            { title: TEXT.cancel, cmd: menuReturnCommand },
        ], { dialogStyle: true, onBack: () => backToCategory(key) });
    }

    function openPage(key) {
        const saved = readSaved().addOns[key];
        page = { key, saved, value: saved };
        showPage();
    }

    // Each language in its own name, the saved one marked; choosing one saves it.
    function openLanguagePage() {
        page = null;
        const saved = languageCodeOf(readSaved().language);
        getMenus().show(LANGUAGE_MENU_ID, [
            ...[...languageCommands].map(([code, cmd]) => ({ title: TEXT.languageNames[code], cmd, radio: code === saved })),
            SEPARATOR,
            { title: TEXT.cancel, cmd: menuReturnCommand },
        ], { selectedCmd: languageCommands.get(saved) ?? null, onBack: () => openList(languageCommand) });
    }

    // A failed read or write is caught here, not by safeHandler, for the
    // owner to see it; reopen then shows the page on the choice saved before.
    function save(keyPath, value, { onSaved, reopen }) {
        try {
            host.files.writeText(envLocalPath, rewriteEnvLine(readEnvLocal(), keyPath, value));
        } catch (error) {
            logHandlerError(SCRIPT_NAME, error);
            getMenus().show(NOT_SAVED_MENU_ID, [
                { title: TEXT.notSaved, cmd: -1 },
                SEPARATOR,
                { title: TEXT.ok, cmd: menuReturnCommand },
            ], { dialogStyle: true, onBack: reopen });
            return;
        }
        host.log(`[${SCRIPT_NAME}] Saved ${envKeyOf(keyPath)}=${value} in .env.local.`);
        onSaved();
    }

    function saveAddOn() {
        const { key, value } = page;
        save(`addOns.${key}`, value, { onSaved: () => backToCategory(key), reopen: () => openPage(key) });
    }

    function saveLanguage(code) {
        save("language", code, { onSaved: () => openList(languageCommand), reopen: openLanguagePage });
    }

    // Fires when any menu opens, with a fresh item list each time, the
    // Operator Menu's included whether the Exit menu or the coin door's
    // service button opened it.
    host.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== OPERATOR_MENU_ID || !seesSetupEntries(profileStore)) return;
        ev.addMenuItem({ after: optionsCommand }, { title: TEXT.menuEntry, cmd: entryCommand });
    }));

    // Fires on every mapped button press: while PinballY gets ready to quit,
    // no button moves the wheel or launches a table.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        if (restartVeil) ev.preventDefault();
    }));

    // Fires on every command: the entry opens the list, a line its page, the
    // switch flips, Save or a language writes.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === entryCommand) {
            openList();
            return;
        }
        if (groupOfCommand.has(ev.id)) openCategory(groupOfCommand.get(ev.id));
        else if (addOnOfCommand.has(ev.id)) openPage(addOnOfCommand.get(ev.id));
        else if (ev.id === languageCommand) openLanguagePage();
        else if (languageOfCommand.has(ev.id)) saveLanguage(languageOfCommand.get(ev.id));
        else if (ev.id === switchCommand && page) {
            page.value = !page.value;
            showPage();
        } else if (ev.id === saveCommand && page) {
            saveAddOn();
        } else if (ev.id === restartCommand) {
            restart();
        }
    }));
}

export function startExpansionPackSettings() {
    let menus = null;
    const getMenus = () => {
        if (!menus) {
            menus = getPackMenus();
            // With Drawn Menus off, a drawn instance of their own, which the
            // wheel dialogs know nothing of unless they wait for it too.
            if (menus !== getDrawnMenus()) getWheelDialogs().waitFor(menus);
        }
        return menus;
    };
    createExpansionPackSettings(createPinballYHost(), getProfileStore(), getMenus);
}
