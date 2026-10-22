// ============================================================
// Expansion Pack Settings: their entry in the Operator Menu, right after
// PinballY's Options, for whoever sees the setup entries; it opens the list
// of every Add-on and the language, as saved in .env.local (read again on
// each opening), and one page per Add-on whose Save rewrites its one line.
// Listens to "menuopen" and "command"; writes .env.local.
// - Started by main.js whatever config.addOns says, its "menuopen" listener before the Drawn Menus Add-on's.
// - Always drawn (getPackMenus), even with the Drawn Menus Add-on off.
// - Nothing applies before PinballY restarts: "on restart" compares the saved and running values.
// ============================================================

import lang from "../core/i18n.js";
import config, { DEFAULTS } from "../core/config.js";
import { applyEnvOverrides, envKeyOf } from "../core/env_overrides.js";
import { logHandlerError, safeHandler } from "../core/safe_handler.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { getProfileStore } from "../profiles/profile_store.js";
import { seesSetupEntries } from "../profiles/setup_entries.js";
import { getDrawnMenus, getPackMenus } from "../drawn_menu/drawn_menu.js";
import { getWheelDialogs } from "../core/wheel_dialog.js";
import { ADD_ON_GROUPS } from "./add_on_catalogue.js";
import { rewriteEnvLine } from "./env_local_rewrite.js";

const SCRIPT_NAME = "ExpansionPackSettings";
const OPERATOR_MENU_ID = "operator";
const LIST_MENU_ID = "expansionPackSettings";
const PAGE_MENU_ID = "expansionPackSettingsPage";
const NOT_SAVED_MENU_ID = "expansionPackSettingsNotSaved";
const SEPARATOR = { cmd: -1 };

// getMenus: what shows the screens, asked on each opening
// (common/drawn_menu/drawn_menu.js); running: the configuration loaded at startup.
export function createExpansionPackSettings(host, profileStore, getMenus, running = config) {
    const { expansionPackSettings: TEXT } = lang;
    const entryCommand = host.allocateCommand("expansionPackSettings");
    const optionsCommand = host.getBuiltInCommand("Options");
    const operatorMenuCommand = host.getBuiltInCommand("ShowOperatorMenu");
    const menuReturnCommand = host.getBuiltInCommand("MenuReturn");
    // One command per line of the list, so that each line can be chosen.
    const addOnCommands = new Map(ADD_ON_GROUPS.flatMap(({ addOns }) => addOns)
        .map(key => [key, host.allocateCommand(`expansionPackSettings_${key}`)]));
    const addOnOfCommand = new Map([...addOnCommands].map(([key, cmd]) => [cmd, key]));
    const languageCommand = host.allocateCommand("expansionPackSettings_language");
    const switchCommand = host.allocateCommand("expansionPackSettings_switch");
    const saveCommand = host.allocateCommand("expansionPackSettings_save");
    const envLocalPath = `${host.getProjectFolder()}\\.env.local`;
    // The page on screen: its Add-on, the choice saved when it opened, and the switch.
    let page = null;

    const readEnvLocal = () => (host.files.fileExists(envLocalPath) ? host.files.readText(envLocalPath) : null);

    // The settings as saved now, the defaults for a missing file or key.
    const readSaved = () => applyEnvOverrides(DEFAULTS, readEnvLocal()).config;

    // A language the pack does not know shows as written.
    const languageNameOf = code => TEXT.languageNames[code] || code;

    const stateOf = value => (value ? TEXT.on : TEXT.off);

    function openList(selectedCmd = null) {
        page = null;
        const saved = readSaved();
        const items = [];
        for (const { group, addOns } of ADD_ON_GROUPS) {
            items.push({ title: TEXT.groups[group], cmd: -1 });
            for (const key of addOns) {
                const state = stateOf(saved.addOns[key]);
                const shownState = saved.addOns[key] === running.addOns[key] ? state : TEXT.onRestart(state);
                items.push({ title: TEXT.addOnLine(TEXT.addOns[key].name, shownState), cmd: addOnCommands.get(key) });
            }
        }
        items.push(
            SEPARATOR,
            // Stays open: choosing it does nothing yet.
            { title: TEXT.languageLine(languageNameOf(saved.language)), cmd: languageCommand, stayOpen: true },
            SEPARATOR,
            { title: TEXT.back, cmd: menuReturnCommand },
        );
        getMenus().show(LIST_MENU_ID, items, { selectedCmd, onBack: () => host.doCommand(operatorMenuCommand) });
    }

    // Back, Exit, Cancel and Save all return to the list on the page's line.
    const backToList = key => openList(addOnCommands.get(key));

    function showPage() {
        const { key, saved, value } = page;
        const { name, whenOn, whenOff } = TEXT.addOns[key];
        getMenus().show(PAGE_MENU_ID, [
            { title: TEXT.pageMessage(whenOn, whenOff), cmd: -1 },
            SEPARATOR,
            // Stays open: the page is shown again over itself, the cursor kept.
            { title: TEXT.addOnLine(name, stateOf(value)), cmd: switchCommand, stayOpen: true },
            ...(value !== saved ? [{ title: TEXT.save, cmd: saveCommand }] : []),
            { title: TEXT.cancel, cmd: menuReturnCommand },
        ], { dialogStyle: true, onBack: () => backToList(key) });
    }

    function openPage(key) {
        const saved = readSaved().addOns[key];
        page = { key, saved, value: saved };
        showPage();
    }

    // A failed read or write is caught here, not by safeHandler, for the
    // owner to see it; the page then shows the choice saved before.
    function save() {
        const { key, value } = page;
        const keyPath = `addOns.${key}`;
        try {
            host.files.writeText(envLocalPath, rewriteEnvLine(readEnvLocal(), keyPath, value));
        } catch (error) {
            logHandlerError(SCRIPT_NAME, error);
            getMenus().show(NOT_SAVED_MENU_ID, [
                { title: TEXT.notSaved, cmd: -1 },
                SEPARATOR,
                { title: TEXT.ok, cmd: menuReturnCommand },
            ], { dialogStyle: true, onBack: () => openPage(key) });
            return;
        }
        host.log(`[${SCRIPT_NAME}] Saved ${envKeyOf(keyPath)}=${value} in .env.local.`);
        backToList(key);
    }

    // Fires when any menu opens, with a fresh item list each time, the
    // Operator Menu's included whether the Exit menu or the coin door's
    // service button opened it.
    host.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== OPERATOR_MENU_ID || !seesSetupEntries(profileStore)) return;
        ev.addMenuItem({ after: optionsCommand }, { title: TEXT.menuEntry, cmd: entryCommand });
    }));

    // Fires on every command: the entry opens the list, a line its page, the
    // switch flips, Save writes.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === entryCommand) {
            openList();
            return;
        }
        if (addOnOfCommand.has(ev.id)) openPage(addOnOfCommand.get(ev.id));
        else if (ev.id === switchCommand && page) {
            page.value = !page.value;
            showPage();
        } else if (ev.id === saveCommand && page) {
            save();
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
