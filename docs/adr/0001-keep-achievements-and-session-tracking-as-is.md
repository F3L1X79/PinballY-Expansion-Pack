---
status: partly superseded by ADR-0004 and ADR-0008
---

# Keep the Achievements and session tracking as they are

After the Period Table and wheel dialog modules were deepened behind the PinballY host (spec #11), an architecture review proposed two more deepenings: one Achievements module built from the host, with the definitions as pure functions over a snapshot, and one Play Session module shared by the session stats tracker, the Achievements and the rating prompt. We declined both. The current code is readable and easy to change as it is. An extra host seam and injection for these modules would add structure the maintainer has to learn, and would not make a day-to-day change noticeably easier. Readability and few files to open come first; testability through the fake host is not a goal on its own for these modules.

## Considered Options

- **Achievements module behind the host.** It would have absorbed `achievements_engine.js`, `common/achievements/achievements.js` and `common/tables/visible_tables.js`, and made the unlock thresholds testable. Rejected: the gain is testability, not readability.
- **Play Session module.** It would have replaced the three separate trackings of a play (stats tracker, rating prompt, Period Table) and the `setTimeout(0)` ordering between them. Rejected for the same reason. The ordering constraint is documented in `main.js` and in the wheel dialog module.

## Consequences

Achievement definitions and the session stats tracker keep reading PinballY globals directly, and their unlock thresholds are only covered by the scenarios run through `main.js`. Reopen this decision if a real bug shows up in those areas that a test through the host would have caught.
