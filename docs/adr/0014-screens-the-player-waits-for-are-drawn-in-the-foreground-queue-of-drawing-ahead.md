---
status: accepted
---

# Screens the player waits for are drawn in a foreground queue of the drawing ahead

The Profile Stats, the Household Stats and the Achievement List block PinballY while they read and draw everything at once (up to about 1 s on the cabinet), so the Loader would stand frozen over them. We decided to cut their opening (reading the stats and drawing each layer) into steps run by `drawing_ahead.js` itself, in a foreground queue: no wait after a button press (the player has just pressed Select to open the screen), slices of about 30 ms with only a short pause for PinballY to turn the comet, and priority over the background work. One scheduler keeps two drawings from ever running at once and keeps its rules in one place.

## Considered Options

- **`getDrawingAhead().add()` as is.** Rejected: it waits 400 ms after the press that opened the screen, then its 12 ms slices with 10 ms pauses nearly double the opening time.
- **A slicer of the screen's own.** Rejected: it would run beside the background slices and add up with them.

## Consequences

- The comet moves less smoothly than at the wheel, the price of an opening barely longer than drawing it all at once.
- The rule of `.claude/rules/conventions.md` on drawing ahead covers this foreground queue too.
