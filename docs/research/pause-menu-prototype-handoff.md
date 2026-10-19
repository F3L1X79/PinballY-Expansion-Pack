# Handoff: drawn pause menu, cabinet prototype

Next session: build a throwaway `/prototype` to run on Félix's cabinet. It must answer whether PinballY's "pause game" menu can be replaced by a Drawn Menu. Then `/handoff` the result back so the grilling of roadmap item `drawn-pause-menu` can finish, followed by `/to-spec`.

## Already recorded (read, don't duplicate)

- Decisions and the prototype checklist are in `docs/roadmap.html`, item `id="drawn-pause-menu"`. They were committed in "Roadmap: pause menu grilled up to a cabinet prototype (roadmap #4)".
- Drawn Menu design: `docs/adr/0013-the-player-s-menus-are-drawn-menus-replacing-the-native-ones.md`. Its last Consequence keeps the pause menu native and gives no reason. That choice was made in grilling commit `1d8aa0d` (2026-10-07), also without a reason.
- Rendering while a game runs ("run freeze"): `docs/research/discreet-achievement-popup.md` §5–6.
- Project rules: `/workspace/.claude/rules/*.md`. Read `bash.md` before any Bash call.

## Research findings (not written anywhere else)

- **How the pause menu opens.** `command.PauseGame` brings PinballY to the foreground, then shows the menu `"pause game"`. Sources: `docs/pinbally/Help/Commands.html` near "PauseGame", and `Menus.html`. While a game runs, button presses arrive as `commandbuttonbgdown`.
- **UI mode during the pause.** `getUIMode()` should return `mode: "menu"`, `menuID: "pause game"` and `runMode: "running"`. That is inferred from `MainWindowObject.html` and has not been seen on the cabinet. A Drawn Menu never changes the UI mode, so with one open the mode would stay `"running"`. Toasts, `wheel_dialog` and drawing ahead (`common/core/drawing_ahead.js`) all wait while `runMode` is set, which is the wanted behaviour.
- **Entries.** They are not documented. Only `command.HighScores` is confirmed (`tests/menus/main_menu_labels_fr.test.js:47`). `ResumeGame`, `KillGame` and `GameInfo` are guesses: log the real titles and command ids.
- **Rendering.** The run freeze is documented for the *background* only. `alpha` and `setPos` changes don't invalidate the window, while `clear`, `draw`, `loadImage` and `removeDrawingLayer` do. Pausing brings PinballY to the foreground, so animations *may* work. This is unverified.
  - It is also unknown whether the window behind the menu is black or shows a frozen frame. PinballY blanks its windows during a game unless "Keep these PinballY windows open" is set.
- **Exit button.** It is often mapped to both Exit and ExitGame. An open Drawn Menu `preventDefault`s every command (`common/drawn_menu/drawn_menu.js` ~507–521), so it would swallow ExitGame too. Unknown: whether Exit on the *native* pause menu resumes the game or ends it.
- **Code that excludes the pause menu.**
  - `addons/drawn_menus.js:17-23`: the `DRAWN_MENU_IDS` allow-list has no "pause game".
  - `addons/drawn_menus.js:44-47`: any other id closes the drawn menu and falls back to the native one.
  - `tests/drawn_menu/drawn_menu_player_menus.test.js:273-280` checks that the pause menu stays native.
- **Hooks for a no-animation variant.**
  - `open(..., { fadeIn: false })` sets alpha to 1 (`drawn_menu.js` ~352).
  - Selection glides use `setInterval` with `setPos`/alpha (~284–301, ~456). If they freeze, the selection must be redrawn instead.
- **Z order.** The Seamless Launch Overlay's Loader sits at Z 5998–5999, under menus (`addons/seamless_launch_overlay.js:16-21`). The Drawn Menu sits at 6200–6205 (`common/drawn_menu/drawn_menu_painter.js:19`).

## Prototype must report

These are the items from the roadmap checklist:
- native entries (titles and command ids) and `getUIMode()` during the pause;
- whether a drawn panel shows above the table;
- whether a fade and a `setPos` animate;
- what is behind the panel: black or a frozen frame;
- whether `ResumeGame` gives focus back to the table;
- what Exit does on the native menu;
- the opening delay.

Keep it throwaway: nothing committed in `addons/`. Félix tests on the cabinet himself.

## After the prototype

- **If even a one-block draw doesn't show:** drop the idea, write the reason into ADR 0013 and the `Drawn Menu` entry of `GLOSSARY.md`, and update the roadmap item.
- **Otherwise:** resume `/grill-with-docs` for the remaining questions, which depend on the results. Name the item by title, because its queue position may change. Then `/to-spec`.

## Suggested skills

- `prototype`: first, in the new session.
- `handoff`: to bring the cabinet results back.
- `grilling` + `domain-modeling` (via `/grill-with-docs`): to finish the grill.
- `to-spec`: afterwards.
