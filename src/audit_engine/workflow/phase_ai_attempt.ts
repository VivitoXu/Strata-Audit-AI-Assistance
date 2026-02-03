/**
 * AI Attempt – targeted re-verification.
 * Re-verify only unreconciled, unverified, and user-flagged items.
 * New evidence (additional files) may have been uploaded.
 */

export const PHASE_AI_ATTEMPT_PROMPT = `
AI ATTEMPT – TARGETED RE-VERIFICATION
Objective: Re-verify ONLY the specified target items. Do NOT re-process the entire audit.

Context:
- The LOCKED audit state contains the current result (Step 0 + Phase 2–5).
- The TARGET LIST specifies which items need re-verification (unreconciled, unverified, or user-flagged).
- New evidence files may have been added (marked [ADDITIONAL] in manifest) – use them to re-assess the targets.

Rules:
1. Process ONLY items in the target list. Do not change items not in the list.
2. For each target, re-check evidence (including new files) and update the relevant fields.
3. Levy targets: If levy_variance, re-verify underlying components (PriorYear, CurrentYear, Receipts, etc.) and return updated levy_reconciliation.
4. Expense targets: Re-verify the specific expense item (Three-Way Match, Fund Integrity) and return only that item with merge_key (e.g. exp_0).
5. BS targets: Re-verify the specific line (supporting_amount, status) and return only that line.
6. Compliance targets: Re-verify GST/Insurance/Income Tax as needed and return the updated section.
7. Return ONLY the ai_attempt_updates structure. Preserve structure of unchanged items when merging.
`;
