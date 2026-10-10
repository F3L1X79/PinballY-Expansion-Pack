# The player's menus are Drawn Menus replacing the native ones

PinballY's native menus (main, Exit, filter choices, power off) and the menus the Add-ons open with `showMenu` look like another program next to the pack's drawn screens. PinballY offers no way to restyle them. We decided that the Drawn Menus Add-on, started last in `main.js`, listens to `menuopen` for the player's menu ids, hands a copy of the final entries to the shared Drawn Menu module (`common/drawn_menu.js`), and calls `preventDefault()` only once the module drew them, setting `menuUpdated` back to false too: PinballY shows a menu marked updated even when `menuopen` is cancelled. Every menu the pack opens itself goes through the same module instead of `showMenu`. The native menu is the fallback: when the Add-on is off, when a menu has no entry to choose, or when drawing throws (the error goes to `logfile.log`).

A Drawn Menu keeps the native behaviour: same entries in the same order, the flippers to move, Select or Launch to choose, Exit to close, PinballY's button sounds. Choosing runs the entry's command as PinballY does for a native menu: the `command` event through `mainWindow.dispatchEvent(new CommandEvent(id))`, then `mainWindow.doCommand` unless a listener prevented it (`doCommand` alone fires no `command` event). So every Add-on's `command` listener hears it as with a native menu, and a command that opens another menu fires `menuopen` again.

## Considered Options

- **Other shapes**, tried on the cabinet (prototype, 2026-10-07): a vertical arc wheel and a horizontal carousel for the menus, buttons side by side for the dialogs. Rejected: one centred list in a panel reads best and matches the native menu's order, so nothing the player knew moves.

## Consequences

- PinballY's UI mode stays "wheel" while a Drawn Menu is open: no `wheelmode` fires when it closes, and modules that wait for a free wheel must ask the module whether a menu is open.
- While a Drawn Menu is open, it swallows every mapped button through `commandbuttondown`, as the other drawn screens do.
- The panel, the glass and the selection outline are images painted by `tools/drawn_menu/generate_drawn_menu.mjs`, drawn ahead once and only placed on each opening (ADR 0005, 0010); the texts are drawn live, within a 100 ms opening budget checked on the cabinet.
- The table's setup and categories menus (`game setup`, `game categories`), opened from the main menu, are drawn too; ticking a category shows the same menu again, redrawn in place without a fade. The other setup menus, the pause menu of a running game and the popups stay native.
