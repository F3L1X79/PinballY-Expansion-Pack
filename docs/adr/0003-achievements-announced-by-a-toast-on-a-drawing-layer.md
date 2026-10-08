# Achievements are announced by a toast on a drawing layer

Achievements used to be announced by a dialog from `common/wheel_dialog.js`, which blocked the wheel until the player pressed a button. We decided to announce them with an Achievement Toast instead: a small card in the bottom-right corner of the playfield screen, drawn on reusable `mainWindow` drawing layers (one per toast on screen, so stacked toasts move and fade independently) at a Z index above everything (menus included), slid in and faded out with timers. It is the only PinballY surface that can sit in a corner, take no input and disappear on its own. Dialogs that expect an answer (startup prompt, rating prompt) stay in the wheel dialog module.

## Considered Options

- **`mainWindow.showPopup`.** Rejected: it always consumes the player's next Select or Exit press, it can only move right of and above the window centre (never bottom-right), it replaces any popup already open, and no script can close it.
- **`mainWindow.message` / status line.** Rejected: `message` is a popup the player must dismiss; the status line is non-modal but its position, font and timing are fixed.
- **A separate media window.** Rejected: a second OS window would fight Windows z-order and focus over the playfield.

## Consequences

- The toast relies on PinballY's `StyledText` (DirectWrite) for semibold, wrapped text (the card's backgrounds and frames are drawn with `fillRect` / `frameRect`: a `StyledText` holding only a space draws no background), so `StyledText` goes through the PinballY host like the other globals.
- While a game runs or launches, PinballY stops redrawing its window and the game covers it: toasts wait in a queue and start once back on the wheel. An Achievement becomes Notified when its toast starts.
- Fonts are limited to those installed in Windows: PinballY cannot load a font file shipped with the project.

Research: `docs/research/discreet-achievement-popup.md`.
