---
status: accepted
---

# The Fireworks are films drawn ahead

The Fireworks have to stand out over the table's video, with glowing streaks that fade out, while a draw blocks PinballY (see ADR 0005) and every change to a layer's alpha costs PinballY a redraw. The Confetti Shower moves one layer per piece, which works because its confetti never fade. We decided to draw each burst ahead as a film, frame by frame, at 20 frames a second, with `drawing_ahead.js`, and to show only one frame at a time: a burst then costs one alpha change to hide a frame and one to show the next. Only the rockets and their trails are moved piece by piece, as the confetti are.

## Considered Options

- **One layer per spark, fading by alpha steps.** Rejected: a few hundred alpha changes a frame for a fade that still looked coarse, and sparks that can't turn, since layers can't rotate.
- **One layer per piece that shrinks instead of fading (cartoon stars, petals).** Cheap, but only a flat cartoon style fits it, judged too cartoon on the cabinet.
- **An external library (fireworks-js, tsParticles).** Rejected: they all redraw a canvas every frame, which PinballY doesn't have. Only fireworks-js's rocket motion is reused, with no import.

## Consequences

- Every burst of a colour scheme is the same film: variety comes from four colour schemes of three colours each, picked so that two bursts in a row never match, and from where each rocket bursts. More schemes cost about 12 MB of graphics memory and nearly 2 s of drawing ahead each.
- About three hundred layers stay alive for the whole session.
- Measured on the cabinet: about 3.9 s of drawing ahead for 341 layers (worst step 17 ms), then 0.3 ms of work a frame during a show, at PinballY's own pace of about 30 frames a second.
- Until the drawing ahead ends, no Fireworks: the Level Toast shows alone.

Prototype and measurements: branch `prototype/fireworks` (verdict in its last commit).
