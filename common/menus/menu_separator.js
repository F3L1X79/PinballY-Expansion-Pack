// ============================================================
// Menu separators, as the pack writes and reads them in PinballY's menu
// item lists: the command of a separator item, and the test telling one
// apart. No side effect.
// ============================================================

export const SEPARATOR_CMD = -1;

// Looser than PinballY's tidyMenu(), which needs title === "": PinballY
// titles its separators "", the pack leaves them untitled.
export const isSeparator = item => item.cmd < 0 && !item.title;
