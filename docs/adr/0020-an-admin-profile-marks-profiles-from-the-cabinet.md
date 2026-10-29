---
status: accepted
---

# An Admin Profile marks Profiles from the cabinet

The Admin and Child marks still live in each Profile's `profile.json`, and editing that file by hand still works, but an Admin Profile can now set or clear both marks of any Profile from the Exit menu's "Manage profiles", which also holds the Profile Reset. This supersedes ADR 0006, which kept marking a deliberate step taken outside the cabinet so that the marks stayed out of the hands of those they restrict. That protection is kept by who may mark, not by where: only an Admin Profile marks, a Child Profile can never become one, and the two marks never go together, so a child can never lift its own mark.

While the household has no Admin Profile, the active Profile, unless it is Guest or a Child Profile, can make itself the first one, and nothing else. This matches the rule already in place, that a household with no Admin Profile restricts nobody. Whoever comes first can take the cabinet, and `profile.json` remains the way to undo it.

## Considered Options

- **The first Admin Profile marked only by hand in `profile.json`.** Rejected: setting up a household would still need PinballY closed and a file edited.
- **The first Admin Profile marked from the Operator Menu opened by the coin door's service button.** Rejected: it needs a coin door with service buttons, and PinballY does not document how to tell that the service button, rather than the Exit menu, opened the Operator Menu.

## Consequences

- The last Admin Profile cannot clear its own mark from the cabinet, so a household never goes back to "everyone sees everything" by accident; only `profile.json` does that.
- Clearing a Child mark takes its Young Players away, without a confirmation: they come back with the mark, since what was Notified is kept.
- A line that cannot be used (the Admin mark of a Child Profile or of the last Admin Profile, the Child mark of an Admin Profile) stays in the menu, greyed out with its reason, which the Drawn Menu has to learn to draw.
