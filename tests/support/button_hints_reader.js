// ============================================================
// Reads the Button Hints of a drawn screen the way the player sees them,
// on the fake PinballY host: from a footer's text strokes, the groups of
// key caps (drawn in the title's colour) each followed by the word saying
// what they do (in the descriptions' colour), left to right; and the
// Exit Button's tooltip on a screen's tooltip layer. Never loaded by PinballY.
// ============================================================

import { STEAMBALL_COLORS } from "../../common/drawing/steamball_palette.js";

const textStrokes = strokes => strokes.filter(stroke => "text" in stroke);

// strokes: a layer's strokes(), or the part of them in a footer band.
// Returns [{ keys: [key cap texts], label }], left to right.
export function readButtonHints(strokes) {
    const groups = [];
    let keys = [];
    for (const stroke of [...textStrokes(strokes)].sort((a, b) => a.rect.x - b.rect.x)) {
        if (stroke.color === STEAMBALL_COLORS.description) {
            groups.push({ keys, label: stroke.text });
            keys = [];
        } else {
            keys.push(stroke.text);
        }
    }
    return groups;
}

// The groups of the shown footer layer at that z-index, null when none shows.
export function buttonHintsOn(fake, zIndex) {
    const [layer] = fake.drawingLayers().filter(candidate => candidate.zIndex === zIndex && candidate.alpha > 0);
    return layer ? readButtonHints(layer.strokes()) : null;
}

// The Button Hints a screen should show, in capitals as drawn, from the
// shared texts (lang.buttonHints): flippers "browse", "scroll" or null,
// select whether Select chooses, exit "back" or "close".
export function expectedButtonHints(lang, { flippers = "browse", select = true, exit }) {
    const TEXT = lang.buttonHints;
    const upper = text => text.toLocaleUpperCase();
    return [
        ...(flippers ? [{ keys: [upper(TEXT.keyCaps.prev), upper(TEXT.keyCaps.next)], label: upper(TEXT[flippers]) }] : []),
        ...(select ? [{ keys: [upper(TEXT.keyCaps.select)], label: upper(TEXT.choose) }] : []),
        { keys: [upper(TEXT.keyCaps.exit)], label: upper(TEXT[exit]) },
    ];
}

// The Exit Button's tooltip shown on the layer at that z-index ("Back" or
// "Close"), null while hidden.
export function exitButtonTooltipOn(fake, zIndex) {
    const [layer] = fake.drawingLayers().filter(candidate => candidate.zIndex === zIndex && candidate.alpha > 0);
    return layer ? layer.texts()[0] || null : null;
}
