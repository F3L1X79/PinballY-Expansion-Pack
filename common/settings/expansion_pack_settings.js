// ============================================================
// Expansion Pack Settings: their entry in the Operator Menu, right after
// PinballY's Options, for whoever sees the setup entries; it opens the list
// of every Add-on (grouped, On / Off) and the language, as saved in
// .env.local, read again on each opening. Listens to "menuopen" and "command".
// - Started by main.js whatever config.addOns says, its "menuopen" listener before the Drawn Menus Add-on's.
// - Always drawn (getPackMenus), even with the Drawn Menus Add-on off.
// ============================================================

import lang from "../core/i18n.js";
import { DEFAULTS } from "../core/config.js";
import { applyEnvOverrides } from "../core/env_overrides.js";
import { safeHandler } from "../core/safe_handler.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { getProfileStore } from "../profiles/profile_store.js";
import { seesSetupEntries } from "../profiles/setup_entries.js";
import { getDrawnMenus, getPackMenus } from "../drawn_menu/drawn_menu.js";
import { getWheelDialogs } from "../core/wheel_dialog.js";
import { ADD_ON_GROUPS } from "./add_on_catalogue.js";

const SCRIPT_NAME = "ExpansionPackSettings";
const OPERATOR_MENU_ID = "operator";
const LIST_MENU_ID = "expansionPackSettings";
const SEPARATOR = { cmd: -1 };

// getMenus: what shows the screens, asked on each opening
// (common/drawn_menu/drawn_menu.js).
export function createExpansionPackSettings(host, profileStore, getMenus) {
    const { expansionPackSettings: TEXT } = lang;
    const entryCommand = host.allocateCommand("expansionPackSettings");
    const optionsCommand = host.getBuiltInCommand("Options");
    const operatorMenuCommand = host.getBuiltInCommand("ShowOperatorMenu");
    const menuReturnCommand = host.getBuiltInCommand("MenuReturn");
    // One command per line of the list, so that each line can be chosen.
    const addOnCommands = new Map(ADD_ON_GROUPS.flatMap(({ addOns }) => addOns)
        .map(key => [key, host.allocateCommand(`expansionPackSettings_${key}`)]));
    const languageCommand = host.allocateCommand("expansionPackSettings_language");
    const envLocalPath = `${host.getProjectFolder()}\\.env.local`;

    // The settings as saved now, the defaults for a missing file or key.
    function readSaved() {
        const text = host.files.fileExists(envLocalPath) ? host.files.readText(envLocalPath) : null;
        return applyEnvOverrides(DEFAULTS, text).config;
    }

    // A language the pack does not know shows as written.
    const languageNameOf = code => TEXT.languageNames[code] || code;

    function openList() {
        const saved = readSaved();
        const items = [];
        for (const { group, addOns } of ADD_ON_GROUPS) {
            items.push({ title: TEXT.groups[group], cmd: -1 });
            for (const key of addOns) {
                const state = saved.addOns[key] ? TEXT.on : TEXT.off;
                // Stays open: choosing a line does nothing yet.
                items.push({ title: TEXT.addOnLine(TEXT.addOns[key].name, state), cmd: addOnCommands.get(key), stayOpen: true });
            }
        }
        items.push(
            SEPARATOR,
            { title: TEXT.languageLine(languageNameOf(saved.language)), cmd: languageCommand, stayOpen: true },
            SEPARATOR,
            { title: TEXT.back, cmd: menuReturnCommand },
        );
        getMenus().show(LIST_MENU_ID, items, { onBack: () => host.doCommand(operatorMenuCommand) });
    }

    // Fires when any menu opens, with a fresh item list each time, the
    // Operator Menu's included whether the Exit menu or the coin door's
    // service button opened it.
    host.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== OPERATOR_MENU_ID || !seesSetupEntries(profileStore)) return;
        ev.addMenuItem({ after: optionsCommand }, { title: TEXT.menuEntry, cmd: entryCommand });
    }));

    // Fires on every command.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === entryCommand) openList();
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
