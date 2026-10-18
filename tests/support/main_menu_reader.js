// ============================================================
// Reads the main menu the way PinballY shows it, on the fake PinballY
// host: the titles of the section (between separators) holding an entry,
// so that a test checks its own entry without copying the whole menu
// order, which tests/menus/main_menu_sections.test.js alone pins, and
// whether a separator is left stray; and a section of the Filter Picker,
// opened from it. Also reads a section from a Drawn Menu's lines. Never
// loaded by PinballY.
// ============================================================

// How a separator reads among the lines, as in drawn_menu_reader.js.
const SEPARATOR = "---";

// The lines of the section holding the first line titled entry,
// separators left out; null when no line has that title.
export function sectionHolding(lines, entry) {
    const at = lines.indexOf(entry);
    if (at === -1) return null;
    let start = at;
    while (start > 0 && lines[start - 1] !== SEPARATOR) start--;
    let end = at;
    while (end < lines.length - 1 && lines[end + 1] !== SEPARATOR) end++;
    return lines.slice(start, end + 1);
}

// Opens the main menu, closes it, and returns its lines. Any item of command -1 is a
// separator: PinballY's are titled "", the pack's untitled.
function mainMenuLines(fake, open) {
    open();
    const lines = fake.currentMenu().items.map(item => (item.cmd === -1 ? SEPARATOR : item.title));
    fake.closeMenu();
    return lines;
}

// The titles of the main menu section holding the entry, or null when the
// entry is absent. Opened by default as PinballY opens it, with its native
// entries.
export function mainMenuSection(fake, entry, open = () => fake.openMainMenu()) {
    return sectionHolding(mainMenuLines(fake, open), entry);
}

// Whether the main menu shows a doubled, leading or trailing separator.
export function mainMenuHasStraySeparator(fake, open = () => fake.openMainMenu()) {
    const lines = mainMenuLines(fake, open);
    return lines.some((line, index) =>
        line === SEPARATOR && (index === 0 || index === lines.length - 1 || lines[index - 1] === SEPARATOR));
}

// The Filter Picker's lines, opened from the main menu as the player does
// (its entry found by its command), the menus then closed. PinballY's
// ShowMainMenu, which the Filter Picker runs to show itself, is set to
// open, for good.
function filterPickerLines(fake, open) {
    fake.setNativeCommand(fake.getBuiltInCommand("ShowMainMenu"), open);
    open();
    const entry = fake.currentMenu().items.find(item => item.cmd === fake.commandId("filterPicker"));
    if (!entry) {
        fake.closeMenu();
        return [];
    }
    fake.selectMenuItem(entry.title);
    const lines = fake.currentMenu().items.map(item => (item.cmd === -1 ? SEPARATOR : item.title));
    // Closing the Filter Picker goes back to the main menu, closed in turn.
    while (fake.currentMenu()) fake.closeMenu();
    return lines;
}

// The titles of the Filter Picker section holding the entry (the wheel
// selections, or the filter groups), or null when the entry is absent or
// the Filter Picker is not offered.
export function filterPickerSection(fake, entry, open = () => fake.openMainMenu()) {
    return sectionHolding(filterPickerLines(fake, open), entry);
}
