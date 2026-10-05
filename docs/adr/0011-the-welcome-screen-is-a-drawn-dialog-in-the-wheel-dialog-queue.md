# The Welcome Screen is a drawn dialog in the wheel dialog queue

The startup prompt was a native PinballY menu submitted to `common/wheel_dialog.js` with the `STARTUP_PROMPT` priority, so that every other dialog waiting at startup (the rating prompt) came after it. It becomes the Welcome Screen, drawn on `mainWindow` drawing layers like the Achievement List, and taking the flippers' input itself. We decided to teach the wheel dialog module a second kind of dialog, a drawn one, that keeps its priority and holds the queue until it closes, instead of showing the Welcome Screen outside the queue with a rule of its own.

## Considered Options

- **A separate rule.** The Welcome Screen shows outside the module, which stays shut until the screen closes. Rejected: two places would decide what the player sees first, and each later drawn dialog (a yearly summary, for instance) would need its own rule.

## Consequences

- One queue still orders everything that waits for the player, native menu or drawn screen, by `DIALOG_PRIORITY`.
- While the Welcome Screen is open, or waiting its turn in the queue, toasts and Confetti Showers wait for it to close, as they wait for a game: they do not show over it, an exception to their "over everything" rule (ADR 0003). Waiting from its submission keeps the Achievements checked at startup from slipping in during the tick before it opens.
- The screen is the first one drawn, so nothing could be drawn ahead. It is drawn at once (about 70 ms on the cabinet) then faded in as a whole: handed to the drawing-ahead module piece by piece, it stayed empty at startup (prototype, 04/10/2026). At startup it waits 500 ms after the wheel is up, as the window is not laid out before.
