# Handoff: Backglass Clock as a diamond plaque, prototype before the spec

Next session: run `/prototype` on the question below, on the cabinet, then `/handoff` the verdict back to the `/grill-with-docs` thread on the Backglass Clock's look (held open in Félix's original session, 2026-10-30).

## Question

Can the Backglass Clock's window be cut to a diamond, the rest showing the table's backglass behind it, with `SetWindowRgn` (User32) and a polygon region (GDI32 `CreatePolygonRgn`) through `dllImport`, during a VPX game?

To answer on the cabinet:
1. Are the diagonal edges, hard-cut to the pixel with no anti-aliasing, acceptable from the playing position? (Félix accepts them if they don't show at that distance.)
2. Does the cut hold through the raises (`setWindowPos` TOPMOST with `SWP_NOACTIVATE`), each minute's redraw, and a move by the owner?
3. Does setting the region activate PinballY, which opens the pause menu during a game? Read the `TEMP #372` log lines (`menuopen "pause game"`).

## Verdict (prototype on the cabinet, 2026-10-30): no diamond, the fallback

Prototype and its evidence: branch `prototype/backglass-clock-diamond` (local; each commit message holds one cabinet run). Facts kept in `docs/pinbally/pinbally-help.md` §2.1.

1. Edges: never judged; the cut never held well enough to look at it from the playing position.
2. The cut holds through raises and redraws in a game without clicks, but PinballY drops it: after a click and a drag, once with no known cause, and in the last run the window got its title bar back and showed in the wheel.
3. Setting the region never activated PinballY. A click on the clock during a game does, cut or not (pause menu).

Félix's decision: the fallback, the wheel's Clock look on plain black with no frame, and the grilling now looks at making the existing window nicer and as small as possible. Constraint found: the window is never less than 200 px tall (asked 320x128, got 320x200), so the window itself can't go below 200 px tall; only the drawing inside it can look smaller, the rest of the window staying black.

## Decisions already taken in the grilling (2026-10-30)

- Look: a small Steamball plaque in the shape of a diamond if the cut works; otherwise the wheel's Clock look (soft white time, drop shadow, gold underline) on plain black, with no frame.
- Size set by the pack at each game, from the backglass screen's height, about the wheel Clock's apparent size; the owner can no longer resize it, but can still move it (their place sticks).
- Default corner: the backglass screen's top right. Félix moves his saved place (top left) once himself, without one-off code.
- The plaque's content (time only, font, painted image) is left to the grilling after the verdict.

## Facts to start from

- Custom windows seen on the cabinet: `docs/pinbally/pinbally-help.md` §2.1 (borderless, placement, the ×1.5 size mismatch that clips the current gold frame, raises in front of the B2S).
- No documentation of window regions or transparency anywhere in `docs/pinbally/`: the region is new ground. `dllImport` rules: `docs/pinbally/pinbally-help.md` and `.claude/rules/conventions.md` (never end a declaration with a `//` comment).
- Bug #386: showing the clock's window on `gamestarted` activates PinballY and pauses every game. Until it is fixed, the prototype either shows the window on `prelaunch` or expects that pause and resumes it.
- The current window: `addons/backglass_clock.js`; the wheel's Clock: `addons/clock.js`; the Steamball painted images: `common/drawn_menu/drawn_menu_images.js`.
