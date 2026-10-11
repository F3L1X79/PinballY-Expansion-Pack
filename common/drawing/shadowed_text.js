// ============================================================
// Text with a soft drop shadow, drawn into a drawing layer's context, so
// it reads over any background video: the Profile picker, its badge and
// the clock share the same look. No side effects on import.
// ============================================================

const FONT = "Segoe UI";
const SHADOW_COLOR = 0xC0000000;
const SHADOW_OFFSET = 2;

// Draws the text across a column (the whole width by default), centred
// unless given another alignment; returns the text's measured size.
export function drawShadowedText(host, dc, { size, weight }, color, text, y,
    { x = 0, width = dc.getSize().width, align = "center" } = {}) {
    let measured = null;
    for (const [offset, textColor] of [[SHADOW_OFFSET, SHADOW_COLOR], [0, color]]) {
        const styled = host.createStyledText({ textAlign: align, textStyle: { font: FONT, size, weight, color: textColor } });
        styled.add(text);
        measured = styled.measure(width);
        styled.draw(dc, { x: x + offset, y: y + offset, width, height: measured.height });
    }
    return measured;
}
