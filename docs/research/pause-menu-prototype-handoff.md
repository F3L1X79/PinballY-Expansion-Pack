# Handoff: drawn pause menu, grilling paused after the cabinet prototype

Next session: resume `/grill-with-docs` on the roadmap item **"Menu de pause en Drawn Menu"** (`docs/roadmap.html`, `id="drawn-pause-menu"`; name it by title, its place in the queue may change). Félix has not answered round 1 yet: post it again (short form, one line per question, he reads in a narrow panel), then the next rounds, then `/to-spec`.

## Already recorded (read, don't duplicate)

- **Prototype verdict and measured facts**: commit `6d07a1f` on branch `prototype/pause-menu` (`git show 6d07a1f`). The probe is `addons/prototype_pause_menu_probe.js` on that branch; `git log main..prototype/pause-menu` tells the story run by run. `main` holds nothing from the prototype.
- **Grilling before the prototype**: decisions in the roadmap item's `<details>`.
- **Drawn Menu design**: `docs/adr/0013-the-player-s-menus-are-drawn-menus-replacing-the-native-ones.md` (last Consequence keeps the pause menu native, no reason given) and the `Drawn Menu` entry of `GLOSSARY.md`.
- **Project rules**: `/workspace/.claude/rules/*.md`. Read `bash.md` before any Bash call.

## Observed by Félix, not in the commit

- Both menus stacked (native not cancelled, no cover): the native pause menu showed through the Drawn Menu's semi-transparent backdrop. Hence the opaque cover.
- "Drawn over native" works. One flaw: the native menu shows for about 1.3 s after "Arrêter la partie", because the cover went away with the panel. Fix: keep the cover until the native `menuclose`.
- Once, a pause menu stayed over the wheel after the game ended (`gameover`/`postlaunch` while the native pause menu was open); it closed with `wheelmode`. Félix calls it a wheel bug.

## Code facts checked this session

- `addons/drawn_menus.js` cancels the native menu (`ev.preventDefault()` + `ev.menuUpdated = false`) once `draw()` succeeded; any id outside `DRAWN_MENU_IDS` calls `drawnMenus.close()`, so the second native opening of the pause would close the panel.
- `common/drawn_menu/drawn_menu.js`: Exit on a menu without `onBack` only calls `close()`. Drawn over a kept-open native menu, that would lift the panel and cover and reveal the native menu: Exit needs a defined effect for the pause.

## Round 1, asked, not answered (recommendation after the arrow; "oui" accepts it)

1. **Exit**: resumes the game (`ResumeGame`) instead of the native loop (closes, PinballY stays in front, menu comes back)? ExitGame from the same press stays swallowed. → yes.
2. **Lifetime**: the drawn pause menu closes on the native pause `menuclose`, whatever its cause; the cover stays until then (fixes the 1.3 s and the menu left over the wheel). → yes.
3. **Double opening**: the second native opening, or the first one's `menuclose`, neither closes nor redraws the panel (no second fade, cursor kept). → yes.
4. **Focus loss**: no watchdog; log a line when the foreground changes during a drawn pause; a ticket if it shows again. → yes.
5. **Spontaneous pauses** (mouse click, Select while loading, `runMode: "starting"`): out of scope; add a roadmap idea for the pause during loading. → yes.
6. **Animations and background**: fade and glide like the other Drawn Menus; the panel alone on the black cover; "frozen animations" dropped. → yes.
7. **Where the mode lives**: a generic `draw()` option (native kept open, cover, close on its `menuclose`, Exit command), not a pause-only path. → yes.
8. **Fallback**: drawing fails → nothing drawn, the never-cancelled native stays; Add-on off → native. → yes.

## Next rounds (depend on round 1)

- **"Annuler" entry**: keep it ("same content" decision) or drop it, given the native loop and Exit's new effect.
- **ADR 0013 and the glossary**: rewrite the last Consequence and the `Drawn Menu` entry once decided.
- Update the roadmap item's `<details>` with the decisions (and the matrix if effort changes).

## Capture still owed (prototype skill, rule 6)

When the spec's tickets exist, put a pointer to branch `prototype/pause-menu` and commit `6d07a1f` on the implementation ticket.
