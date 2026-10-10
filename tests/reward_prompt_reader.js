// ============================================================
// Reads the Reward Prompt the way the player sees it, on the fake
// PinballY host: every Reward Prompt shown so far, its message and
// buttons joined, and the English text it shows for a frame.
// Never loaded by PinballY.
// ============================================================

export const REWARD_PROMPT_ID = "rewardPrompt";

// Each Reward Prompt shown so far: its message, then its buttons, joined.
export const rewardPrompts = fake => fake.shownMenus()
    .filter(menu => menu.id === REWARD_PROMPT_ID)
    .map(menu => menu.items.filter(item => item.title).map(item => item.title).join(" | "));

export const promptOf = frameName =>
    `You won the Avatar Frame "${frameName}"! Equip it from "Your Stats", then "Frame". | Go equip it | Got it`;
