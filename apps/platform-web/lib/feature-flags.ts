// Lightweight client/server feature flags for temporarily hiding features
// without deleting their code. Flip a flag back to `true` to restore.

// "취업 모험" (matching-probability quest) entry points. The page/route at
// /matching-probability stays intact — only the links/CTAs that surface it
// are gated — so it can be re-enabled later by setting this to true.
export const MATCHING_QUEST_ENABLED = false;
